import { query, sql } from '../config/db.js';
import { httpError }  from '../utils/helpers.js';
import auditLog       from '../utils/audit.js';

// ── Helper: generate invoice from booking ─────────────────────
const generateInvoice = async (bookingID) => {
  const result = await query(
    `SELECT b.basePrice, b.taxRate, b.feeID,
            bf.feeAmount,
            i.invoiceID
     FROM   bookings b
     LEFT   JOIN booking_fees bf ON bf.feeID     = b.feeID
     LEFT   JOIN invoices     i  ON i.bookingID  = b.bookingID
     WHERE  b.bookingID = @bookingID`,
    { bookingID: { type: sql.Int, value: bookingID } }
  );

  if (!result.recordset[0]) return null;
  if (result.recordset[0].invoiceID) return result.recordset[0].invoiceID;

  const { basePrice, taxRate, feeAmount } = result.recordset[0];
  const subtotal   = parseFloat(basePrice);
  const taxAmount  = parseFloat((subtotal * (parseFloat(taxRate || 5) / 100)).toFixed(2));
  const fee        = parseFloat(feeAmount || 0);
  const totalAmount = parseFloat((subtotal + taxAmount + fee).toFixed(2));

  const inv = await query(
    `INSERT INTO invoices (bookingID, invoiceDate, subtotal, taxAmount, feeAmount, totalAmount, status)
     OUTPUT INSERTED.invoiceID
     VALUES (@bookingID, GETDATE(), @subtotal, @taxAmount, @feeAmount, @totalAmount, 'unpaid')`,
    {
      bookingID:   { type: sql.Int,     value: bookingID },
      subtotal:    { type: sql.Decimal, value: subtotal },
      taxAmount:   { type: sql.Decimal, value: taxAmount },
      feeAmount:   { type: sql.Decimal, value: fee },
      totalAmount: { type: sql.Decimal, value: totalAmount },
    }
  );
  return inv.recordset[0].invoiceID;
};

// ── Helper: generate commission from supplier ─────────────────
// Per project spec: commission is paid BY supplier TO the agency
// Due date = 60 days after trip end date
// Replace the existing generateCommission function with this:
const generateCommission = async (bookingID) => {
  try {
    // Get all unique suppliers from booking items
    const itemsResult = await query(
      `SELECT DISTINCT
         bi.supplierID,
         s.commissionRate,
         ISNULL(SUM(bi.lineTotal), 0) AS supplierTotal,
         b.tripEnd,
         i.invoiceID
       FROM   booking_items bi
       JOIN   suppliers     s ON s.supplierID = bi.supplierID
       JOIN   bookings      b ON b.bookingID  = bi.bookingID
       LEFT   JOIN invoices i ON i.bookingID  = b.bookingID
       WHERE  bi.bookingID = @bookingID
       GROUP  BY bi.supplierID, s.commissionRate, b.tripEnd, i.invoiceID`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    for (const row of itemsResult.recordset) {
      // Check if commission already exists for this booking+supplier
      const existing = await query(
        `SELECT commissionID FROM commissions
         WHERE bookingID = @bookingID AND supplierID = @supplierID`,
        {
          bookingID:  { type: sql.Int, value: bookingID },
          supplierID: { type: sql.Int, value: row.supplierID },
        }
      );
      if (existing.recordset[0]) continue; // Already generated

      const commissionAmount = parseFloat(
        ((row.supplierTotal * row.commissionRate) / 100).toFixed(2)
      );
      const dueDate = row.tripEnd
        ? new Date(new Date(row.tripEnd).getTime() + 60 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]
        : null;

      await query(
        `INSERT INTO commissions
           (bookingID, supplierID, invoiceID, commissionRate,
            commissionAmount, status, dueDate)
         VALUES
           (@bookingID, @supplierID, @invoiceID, @commissionRate,
            @commissionAmount, 'pending', @dueDate)`,
        {
          bookingID:        { type: sql.Int,      value: bookingID },
          supplierID:       { type: sql.Int,      value: row.supplierID },
          invoiceID:        { type: sql.Int,      value: row.invoiceID },
          commissionRate:   { type: sql.Decimal,  value: row.commissionRate },
          commissionAmount: { type: sql.Decimal,  value: commissionAmount },
          dueDate:          { type: sql.Date,     value: dueDate },
        }
      );
    }
  } catch (err) {
    console.error('generateCommission failed:', err.message);
  }
};

// PUT /api/bookings/:id/confirm ────────────────────────────────
const confirmBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);

    await query(
      `UPDATE bookings SET status = 'confirmed', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status = 'pending'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    const invoiceID = await generateInvoice(bookingID);

    await auditLog(req, 'CONFIRM', 'bookings', bookingID,
      { status: 'pending' }, { status: 'confirmed' });

    res.json({ message: 'Booking confirmed.', invoiceID });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/complete ──────────────────────────────
const completeBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);

    await query(
      `UPDATE bookings SET status = 'completed', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status = 'confirmed'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    await auditLog(req, 'COMPLETE', 'bookings', bookingID,
      { status: 'confirmed' }, { status: 'completed' });

    res.json({ message: 'Booking marked as completed.' });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id/cancel ────────────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);

    await query(
      `UPDATE bookings SET status = 'cancelled', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status IN ('pending','confirmed')`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    await auditLog(req, 'CANCEL', 'bookings', bookingID,
      { status: 'pending/confirmed' }, { status: 'cancelled' });

    res.json({ message: 'Booking cancelled.' });
  } catch (err) { next(err); }
};

// PUT /api/invoices/:id/mark-paid ─────────────────────────────
// Manually marks invoice paid and triggers commission generation
const markInvoicePaid = async (req, res, next) => {
  try {
    const invoiceID = parseInt(req.params.id);

    // Get bookingID before updating
    const invResult = await query(
      `SELECT bookingID FROM invoices WHERE invoiceID = @invoiceID`,
      { invoiceID: { type: sql.Int, value: invoiceID } }
    );
    if (!invResult.recordset[0]) throw httpError(404, 'Invoice not found.');
    const { bookingID } = invResult.recordset[0];

    // Mark invoice paid
    await query(
      `UPDATE invoices SET status = 'paid', updatedAt = GETDATE()
       WHERE  invoiceID = @invoiceID`,
      { invoiceID: { type: sql.Int, value: invoiceID } }
    );

    // Complete the booking
    await query(
      `UPDATE bookings SET status = 'completed', updatedAt = GETDATE()
       WHERE  bookingID = @bookingID AND status != 'cancelled'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    // Generate commission from supplier (money owed TO the agency)
    await generateCommission(invoiceID, req);

    // Update lead member share status
    await query(
      `UPDATE bc
       SET    bc.sharePaid   = bc.shareAmount,
              bc.shareStatus = 'paid'
       FROM   booking_customers bc
       WHERE  bc.bookingID = @bookingID AND bc.role = 'lead'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    // Auto-mark zero-share members as paid
    await query(
      `UPDATE booking_customers
       SET    shareStatus = 'paid', sharePaid = 0
       WHERE  bookingID = @bookingID
       AND   (shareAmount = 0 OR shareAmount IS NULL)`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    await auditLog(req, 'MARK_PAID', 'invoices', invoiceID,
      { status: 'unpaid' }, { status: 'paid' });
    await auditLog(req, 'COMPLETE', 'bookings', bookingID,
      { status: 'confirmed' }, { status: 'completed' });

    res.json({ message: 'Invoice marked as paid. Commission generated.' });
  } catch (err) { next(err); }
};

// GET /api/notifications ──────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const isAgent   = req.user.role === 'agent';
    const isManager = ['superadmin', 'manager'].includes(req.user.role);
    const isAcct    = ['superadmin', 'accountant'].includes(req.user.role);
    const empID     = req.user.employeeID;

    const notifications = [];

    // ── Manager / Accountant notifications ───────────────────
    if (isManager || isAcct) {

      // Commissions pending verification (owed by suppliers to agency)
      const pendingComm = await query(
        `SELECT COUNT(*) AS cnt FROM commissions WHERE status = 'pending'`
      );
      const cnt = pendingComm.recordset[0].cnt;
      if (cnt > 0) {
        notifications.push({
          type:    'commission_pending',
          message: `${cnt} commission${cnt > 1 ? 's' : ''} pending verification from suppliers`,
          count:   cnt,
          link:    '/commissions',
        });
      }

      // Overdue commissions — past 60-day due date, not yet received
      const overdueComm = await query(
        `SELECT COUNT(*) AS cnt FROM commissions
         WHERE  status IN ('pending', 'approved')
         AND    dueDate < GETDATE()
         AND    dueDate IS NOT NULL`
      );
      const cntOD = overdueComm.recordset[0].cnt;
      if (cntOD > 0) {
        notifications.push({
          type:    'commission_overdue',
          message: `${cntOD} commission${cntOD > 1 ? 's' : ''} overdue from suppliers`,
          count:   cntOD,
          link:    '/commissions',
        });
      }

      // Overdue invoices
      const overdueInv = await query(
        `SELECT COUNT(*) AS cnt FROM invoices
         WHERE  status IN ('unpaid','partial')
         AND    dueDate < GETDATE()`
      );
      const cntInv = overdueInv.recordset[0].cnt;
      if (cntInv > 0) {
        notifications.push({
          type:    'invoice_overdue',
          message: `${cntInv} overdue invoice${cntInv > 1 ? 's' : ''}`,
          count:   cntInv,
          link:    '/invoices',
        });
      }
    }

    // ── Agent notifications ───────────────────────────────────
    if (isAgent) {

      // Agent's own pending bookings
      const pendingBook = await query(
        `SELECT COUNT(*) AS cnt FROM bookings
         WHERE  employeeID = @empID AND status = 'pending'`,
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

      // Agent's unconfirmed bookings with invoices unpaid
      const unpaidInv = await query(
        `SELECT COUNT(*) AS cnt
         FROM   invoices  i
         JOIN   bookings  b ON b.bookingID = i.bookingID
         WHERE  b.employeeID = @empID
         AND    i.status IN ('unpaid', 'partial')`,
        { empID: { type: sql.Int, value: empID } }
      );
      const cntInv = unpaidInv.recordset[0].cnt;
      if (cntInv > 0) {
        notifications.push({
          type:    'invoice_overdue',
          message: `${cntInv} invoice${cntInv > 1 ? 's' : ''} pending payment from your clients`,
          count:   cntInv,
          link:    '/invoices',
        });
      }
    }

    res.json({ notifications, total: notifications.length });
  } catch (err) { next(err); }
};

export {
  confirmBooking,
  completeBooking,
  cancelBooking,
  markInvoicePaid,
  getNotifications,
  generateCommission,
  generateInvoice,
};