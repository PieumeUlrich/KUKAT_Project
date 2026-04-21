import { query, sql } from '../config/db.js';
import { httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';

// ── Auto-generate invoice when booking is confirmed ────────────
// Called internally — not a route handler
const generateInvoice = async (bookingID) => {
  // Check no invoice exists yet
  const existing = await query(
    `SELECT invoiceID FROM invoices WHERE bookingID = @bookingID`,
    { bookingID: { type: sql.Int, value: bookingID } }
  );
  if (existing.recordset[0]) return existing.recordset[0].invoiceID;

  // Fetch booking details
  const bookResult = await query(
    `SELECT b.basePrice, b.taxRate, b.feeID,
            bf.feeAmount,
            b.bookingDate
     FROM   bookings b
     LEFT   JOIN booking_fees bf ON bf.feeID = b.feeID
     WHERE  b.bookingID = @bookingID`,
    { bookingID: { type: sql.Int, value: bookingID } }
  );
  if (!bookResult.recordset[0]) throw new Error('Booking not found.');

  const { basePrice, taxRate, feeAmount, bookingDate } = bookResult.recordset[0];
  const subtotal  = parseFloat(basePrice);
  const taxAmount = parseFloat((subtotal * (parseFloat(taxRate || 5) / 100)).toFixed(2));
  const fee       = parseFloat(feeAmount || 0);
  const total     = parseFloat((subtotal + taxAmount + fee).toFixed(2));

  // Due date = 30 days from booking date
  const invoiceDate = new Date();
  const dueDate     = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const result = await query(
    `INSERT INTO invoices
       (bookingID, invoiceDate, subtotal, taxAmount, feeAmount, totalAmount, status, dueDate)
     OUTPUT INSERTED.invoiceID
     VALUES
       (@bookingID, @invoiceDate, @subtotal, @taxAmount, @feeAmount, @totalAmount, 'unpaid', @dueDate)`,
    {
      bookingID:   { type: sql.Int,     value: bookingID },
      invoiceDate: { type: sql.Date,    value: invoiceDate },
      subtotal:    { type: sql.Decimal, value: subtotal },
      taxAmount:   { type: sql.Decimal, value: taxAmount },
      feeAmount:   { type: sql.Decimal, value: fee },
      totalAmount: { type: sql.Decimal, value: total },
      dueDate:     { type: sql.Date,    value: dueDate },
    }
  );
  return result.recordset[0].invoiceID;
};

// ── Auto-generate commission when invoice is paid ──────────────
// Called internally — not a route handler
const generateCommission = async (invoiceID) => {
  // Check no commission exists yet for this invoice
  const existing = await query(
    `SELECT commissionID FROM commissions WHERE invoiceID = @invoiceID`,
    { invoiceID: { type: sql.Int, value: invoiceID } }
  );
  if (existing.recordset.length > 0) return;

  // Fetch invoice → booking → employee → supplier commission rate
  const result = await query(
    `SELECT
       b.bookingID, b.employeeID, b.basePrice,
       s.commissionRate
     FROM   invoices  i
     JOIN   bookings  b ON b.bookingID  = i.bookingID
     JOIN   products  p ON p.productID  = b.productID
     JOIN   suppliers s ON s.supplierID = p.supplierID
     WHERE  i.invoiceID = @invoiceID`,
    { invoiceID: { type: sql.Int, value: invoiceID } }
  );
  if (!result.recordset[0]) return;

  const { bookingID, employeeID, basePrice, commissionRate } = result.recordset[0];
  const rate   = parseFloat(commissionRate || 10);
  const amount = parseFloat((parseFloat(basePrice) * (rate / 100)).toFixed(2));

  const newRecord = await query(
    `INSERT INTO commissions
       (bookingID, employeeID, invoiceID, commissionRate, commissionAmount, status)
     VALUES
       (@bookingID, @employeeID, @invoiceID, @rate, @amount, 'pending')`,
    {
      bookingID:   { type: sql.Int,     value: bookingID },
      employeeID:  { type: sql.Int,     value: employeeID },
      invoiceID:   { type: sql.Int,     value: invoiceID },
      rate:        { type: sql.Decimal, value: rate },
      amount:      { type: sql.Decimal, value: amount },
    }
    
  );
  const newCommission = newRecord.recordset[0];
  await auditLog(req, 'CREATE', 'commissions', newCommission.commissionID, null, {
    invoiceID, bookingID, rate, amount, status: 'pending'
  });
};

// PUT /api/bookings/:id/confirm
// Confirms a booking AND auto-generates the invoice
const confirmBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);

    // Update status to confirmed
    await query(
      `UPDATE bookings SET status = 'confirmed', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status = 'pending'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    // Auto-generate invoice
    const invoiceID = await generateInvoice(bookingID);

    await auditLog(req, 'CONFIRM', 'bookings', id, { status: 'pending' }, { status: 'confirmed' });
    res.json({ message: 'Booking confirmed.', invoiceID });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/complete
// Marks booking as completed
const completeBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);
    await query(
      `UPDATE bookings SET status = 'completed', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status = 'confirmed'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );
    await auditLog(req, 'COMPLETE', 'bookings', bookingID, { status: 'confirmed' }, { status: 'completed' });
    res.json({ message: 'Booking marked as completed.' });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/cancel
// Cancels a booking
const cancelBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);
    await query(
      `UPDATE bookings SET status = 'cancelled', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status IN ('pending','confirmed')`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );
    await auditLog(req, 'CANCEL', 'bookings', id, { status: 'pending/confirmed' }, { status: 'cancelled' });
    res.json({ message: 'Booking cancelled.' });
  } catch (err) { next(err); }
};

// PUT /api/invoices/:id/mark-paid  (enhanced — also triggers commission)
// This replaces the one in invoicesController
const markInvoicePaid = async (req, res, next) => {
  try {
    const invoiceID = parseInt(req.params.id);

    // Mark invoice paid
    await query(
      `UPDATE invoices SET status = 'paid', updatedAt = GETDATE()
       WHERE  invoiceID = @invoiceID`,
      { invoiceID: { type: sql.Int, value: invoiceID } }
    );

    // Auto-generate commission
    await generateCommission(invoiceID);

    await auditLog(req, 'MARK_PAID', 'invoices', invoiceID, { status: 'unpaid' }, { status: 'paid' });
    res.json({ message: 'Invoice marked as paid. Commission generated.' });
  } catch (err) { next(err); }
};

// GET /api/notifications
// Returns pending items relevant to the logged-in user
const getNotifications = async (req, res, next) => {
  try {
    const isAgent   = req.user.role === 'agent';
    const isManager = ['superadmin', 'manager'].includes(req.user.role);
    const isAcct    = ['superadmin', 'accountant'].includes(req.user.role);
    const empID     = req.user.employeeID;

    const notifications = [];

    if (isManager || isAcct) {
      // Commissions awaiting approval
      const pendingComm = await query(
        `SELECT COUNT(*) AS cnt FROM commissions WHERE status = 'pending'`
      );
      const cnt = pendingComm.recordset[0].cnt;
      if (cnt > 0) {
        notifications.push({
          type:    'commission_pending',
          message: `${cnt} commission${cnt > 1 ? 's' : ''} awaiting approval`,
          count:   cnt,
          link:    '/commissions',
        });
      }
    }

    if (isManager || isAcct) {
      // Overdue invoices
      const overdueInv = await query(
        `SELECT COUNT(*) AS cnt FROM invoices
         WHERE status IN ('unpaid','partial') AND dueDate < GETDATE()`
      );
      const cnt = overdueInv.recordset[0].cnt;
      if (cnt > 0) {
        notifications.push({
          type:    'invoice_overdue',
          message: `${cnt} overdue invoice${cnt > 1 ? 's' : ''}`,
          count:   cnt,
          link:    '/invoices',
        });
      }
    }

    if (isAgent) {
      // Agent's own pending bookings
      const pendingBook = await query(
        `SELECT COUNT(*) AS cnt FROM bookings
         WHERE employeeID = @empID AND status = 'pending'`,
        { empID: { type: sql.Int, value: empID } }
      );
      const cnt = pendingBook.recordset[0].cnt;
      if (cnt > 0) {
        notifications.push({
          type:    'booking_pending',
          message: `${cnt} booking${cnt > 1 ? 's' : ''} awaiting confirmation`,
          count:   cnt,
          link:    '/bookings',
        });
      }

      // Agent's approved commissions ready for payment
      const approvedComm = await query(
        `SELECT COUNT(*) AS cnt FROM commissions
         WHERE employeeID = @empID AND status = 'approved'`,
        { empID: { type: sql.Int, value: empID } }
      );
      const cntC = approvedComm.recordset[0].cnt;
      if (cntC > 0) {
        notifications.push({
          type:    'commission_approved',
          message: `${cntC} commission${cntC > 1 ? 's' : ''} approved and ready for payment`,
          count:   cntC,
          link:    '/commissions',
        });
      }
    }

    res.json({ notifications, total: notifications.length });
  } catch (err) { next(err); }
};

export {
  generateInvoice,
  generateCommission,
  confirmBooking,
  completeBooking,
  cancelBooking,
  markInvoicePaid,
  getNotifications,
};
