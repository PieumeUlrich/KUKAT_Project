import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';
import { generateCommission } from './automationController.js'; // ← import helper

// GET /api/invoices/stats
const getStats = async (req, res, next) => {
  try {
    const params = {};
    const conditions = [];
    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('b.employeeID = @empID');
    }
    const where = conditions.length
      ? `JOIN bookings b ON b.bookingID = i.bookingID WHERE ${conditions.join(' AND ')}`
      : '';
    const result = await query(
      `SELECT
         COUNT(*)                                                                      AS total,
         SUM(CASE WHEN i.status = 'paid'     THEN 1 ELSE 0 END)                      AS paid,
         SUM(CASE WHEN i.status = 'unpaid'   THEN 1 ELSE 0 END)                      AS unpaid,
         SUM(CASE WHEN i.status = 'partial'  THEN 1 ELSE 0 END)                      AS partial,
         SUM(CASE WHEN i.status = 'refunded' THEN 1 ELSE 0 END)                      AS refunded,
         ISNULL(SUM(CASE WHEN i.status = 'paid'   THEN i.totalAmount ELSE 0 END), 0) AS totalCollected,
         ISNULL(SUM(CASE WHEN i.status = 'unpaid' THEN i.totalAmount ELSE 0 END), 0) AS totalOutstanding
       FROM invoices i ${where}`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/invoices
const getAll = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, status } = req.query;
    const conditions = [];

    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('b.employeeID = @empID');
    }
    if (status) {
      params.status = { type: sql.NVarChar, value: status };
      conditions.push('i.status = @status');
    }
    const searchClause = buildSearch(search, [
      'CAST(i.invoiceID AS NVARCHAR)',
      'CAST(i.bookingID AS NVARCHAR)',
      'c.firstName', 'c.lastName',
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM invoices i
       JOIN bookings  b ON b.bookingID  = i.bookingID
       JOIN customers c ON c.customerID = b.customerID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT i.invoiceID, i.bookingID, i.invoiceDate, i.dueDate,
              i.subtotal, i.taxAmount, i.feeAmount, i.totalAmount, i.status,
              c.firstName + ' ' + c.lastName AS customerName, c.customerID
       FROM   invoices  i
       JOIN   bookings  b ON b.bookingID  = i.bookingID
       JOIN   customers c ON c.customerID = b.customerID
       ${where}
       ORDER  BY i.invoiceDate DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/invoices/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [invResult, paymentsResult] = await Promise.all([
      query(
        `SELECT i.*,
                b.bookingDate, b.tripStart, b.tripEnd, b.basePrice, b.taxRate,
                c.firstName AS customerFirstName, c.lastName AS customerLastName,
                c.email AS customerEmail,
                p.productName,
                e.firstName + ' ' + e.lastName AS agentName
         FROM   invoices  i
         JOIN   bookings  b ON b.bookingID  = i.bookingID
         JOIN   customers c ON c.customerID = b.customerID
         JOIN   products  p ON p.productID  = b.productID
         JOIN   employees e ON e.employeeID = b.employeeID
         WHERE  i.invoiceID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
      query(
        `SELECT paymentID, billedAmount, amountPaid, paymentMethod,
                paymentDate, paymentType, status, reference
         FROM   payments WHERE invoiceID = @id ORDER BY paymentDate`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);
    if (!invResult.recordset[0]) throw httpError(404, 'Invoice not found.');
    res.json({ ...invResult.recordset[0], payments: paymentsResult.recordset });
  } catch (err) { next(err); }
};

// POST /api/invoices/:id/payments
const addPayment = async (req, res, next) => {
  try {
    const invoiceID = parseInt(req.params.id);
    const { billedAmount, amountPaid, paymentMethod, paymentDate,
            paymentType, reference, notes, cardID } = req.body;

    if (!amountPaid || !paymentMethod) {
      throw httpError(400, 'amountPaid and paymentMethod are required.');
    }

    // ── 1. Record payment in payments table ─────────────────
    const insertResult = await query(
      `INSERT INTO payments
        (invoiceID, cardID, billedAmount, amountPaid, paymentMethod,
         paymentDate, paymentType, status, reference, notes)
       OUTPUT INSERTED.paymentID
       VALUES
        (@invoiceID, @cardID, @billedAmount, @amountPaid, @paymentMethod,
         @paymentDate, @paymentType, 'completed', @reference, @notes)`,
      {
        invoiceID:     { type: sql.Int,      value: invoiceID },
        cardID:        { type: sql.Int,      value: cardID || null },
        billedAmount:  { type: sql.Decimal,  value: parseFloat(billedAmount || amountPaid) },
        amountPaid:    { type: sql.Decimal,  value: parseFloat(amountPaid) },
        paymentMethod: { type: sql.NVarChar, value: paymentMethod },
        paymentDate:   { type: sql.Date,     value: paymentDate || new Date() },
        paymentType:   { type: sql.NVarChar, value: paymentType || 'partial' },
        reference:     { type: sql.NVarChar, value: reference   || null },
        notes:         { type: sql.NVarChar, value: notes       || null },
      }
    );
    const newPaymentID = insertResult.recordset[0].paymentID;

    // ── 2. Recalculate invoice totals from payments table ───
    const sumResult = await query(
      `SELECT i.totalAmount, i.bookingID,
              ISNULL(SUM(p.amountPaid), 0) AS totalPaid
       FROM   invoices i
       LEFT   JOIN payments p ON p.invoiceID = i.invoiceID
                              AND p.status = 'completed'
       WHERE  i.invoiceID = @invoiceID
       GROUP  BY i.totalAmount, i.bookingID`,
      { invoiceID: { type: sql.Int, value: invoiceID } }
    );

    if (!sumResult.recordset[0]) throw httpError(404, 'Invoice not found.');

    const { totalAmount, totalPaid, bookingID } = sumResult.recordset[0];
    const invoiceStatus = parseFloat(totalPaid) >= parseFloat(totalAmount) ? 'paid'
                        : parseFloat(totalPaid) > 0                        ? 'partial'
                        : 'unpaid';

    // ── 3. Update invoice status ─────────────────────────────
    await query(
      `UPDATE invoices SET status = @status, updatedAt = GETDATE()
       WHERE invoiceID = @invoiceID`,
      {
        status:    { type: sql.NVarChar, value: invoiceStatus },
        invoiceID: { type: sql.Int,      value: invoiceID },
      }
    );

    // ── 4. Update lead member share status only ─────────────
    const leadResult = await query(
      `SELECT bc.bookingCustomerID, bc.shareAmount
       FROM   booking_customers bc
       WHERE  bc.bookingID = @bookingID AND bc.role = 'lead'`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    if (leadResult.recordset[0]) {
      const shareAmount   = parseFloat(leadResult.recordset[0].shareAmount || 0);
      const leadSharePaid = shareAmount > 0
        ? Math.min(parseFloat(totalPaid), shareAmount) : 0;
      const leadStatus    = leadSharePaid >= shareAmount && shareAmount > 0 ? 'paid'
                          : leadSharePaid > 0                               ? 'partial'
                          : 'unpaid';

      await query(
        `UPDATE booking_customers
         SET sharePaid   = @sharePaid,
             shareStatus = @shareStatus
         WHERE bookingCustomerID = @id`,
        {
          sharePaid:   { type: sql.Decimal,  value: leadSharePaid },
          shareStatus: { type: sql.NVarChar, value: leadStatus },
          id:          { type: sql.Int,      value: leadResult.recordset[0].bookingCustomerID },
        }
      );
    }

    // ── 5. Auto-mark zero-share members as paid ─────────────
    await query(
      `UPDATE booking_customers
       SET shareStatus = 'paid', sharePaid = 0
       WHERE bookingID = @bookingID
       AND (shareAmount = 0 OR shareAmount IS NULL)`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );

    // ── 6. When fully paid — complete booking + generate commission ──
    if (invoiceStatus === 'paid') {

      // Complete the booking
      await query(
        `UPDATE bookings
         SET status = 'completed', updatedAt = GETDATE()
         WHERE bookingID = @bookingID AND status != 'cancelled'`,
        { bookingID: { type: sql.Int, value: bookingID } }
      );
      await auditLog(req, 'COMPLETE', 'bookings', bookingID,
        { status: 'confirmed' }, { status: 'completed' });

      // Generate commission from supplier — uses shared helper
      // Helper checks for duplicate, calculates from supplierID + dueDate
      await generateCommission(invoiceID, req);
    }

    // ── 7. Audit log ─────────────────────────────────────────
    await auditLog(req, 'ADD_PAYMENT', 'payments', newPaymentID, null, req.body);

    res.status(201).json({
      message:     'Payment recorded.',
      invoiceStatus,
      totalPaid:   parseFloat(totalPaid),
      totalAmount: parseFloat(totalAmount),
      remaining:   Math.max(parseFloat(totalAmount) - parseFloat(totalPaid), 0),
    });
  } catch (err) { next(err); }
};

// markPaid removed — use automation.markInvoicePaid from automationController.js
// which handles commission generation, booking completion and member sync

export { getStats, getAll, getById, addPayment };