import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';

// GET /api/commissions/stats
const getStats = async (req, res, next) => {
  try {
    // ── Agents no longer see commissions — commissions are agency revenue
    // Stats are global for managers/accountants
    const result = await query(
      `SELECT
         COUNT(*)                                                                            AS total,
         SUM(CASE WHEN c.status = 'pending'   THEN 1 ELSE 0 END)                           AS pending,
         SUM(CASE WHEN c.status = 'approved'  THEN 1 ELSE 0 END)                           AS approved,
         SUM(CASE WHEN c.status = 'paid'      THEN 1 ELSE 0 END)                           AS paid,
         SUM(CASE WHEN c.status = 'cancelled' THEN 1 ELSE 0 END)                           AS cancelled,
         ISNULL(SUM(CASE WHEN c.status = 'paid'    THEN c.commissionAmount ELSE 0 END), 0) AS totalPaid,
         ISNULL(SUM(CASE WHEN c.status = 'pending' THEN c.commissionAmount ELSE 0 END), 0) AS totalPending,
         SUM(CASE WHEN c.status NOT IN ('paid','cancelled')
                   AND c.dueDate IS NOT NULL
                   AND c.dueDate < GETDATE() THEN 1 ELSE 0 END)                            AS overdueCount
       FROM commissions c`
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/commissions
const getAll = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, status } = req.query;
    const conditions = [];

    if (status) {
      params.status = { type: sql.NVarChar, value: status };
      conditions.push('c.status = @status');
    }

    const searchClause = buildSearch(search, [
      's.supplierName',
      'CAST(c.bookingID AS NVARCHAR)',
      'CAST(c.commissionID AS NVARCHAR)',
      'e.firstName', 'e.lastName',
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM   commissions c
       LEFT   JOIN suppliers s ON s.supplierID = c.supplierID
       LEFT   JOIN bookings  b ON b.bookingID  = c.bookingID
       LEFT   JOIN employees e ON e.employeeID = b.employeeID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT c.commissionID, c.bookingID, c.invoiceID,
              c.commissionRate, c.commissionAmount,
              c.status, c.approvedAt, c.createdAt, c.dueDate,
              s.supplierID, s.supplierName,
              e.firstName + ' ' + e.lastName AS agentName,
              e.agentCode,
              CASE WHEN c.status NOT IN ('paid','cancelled')
                    AND c.dueDate IS NOT NULL
                    AND c.dueDate < GETDATE() THEN 1 ELSE 0 END AS isOverdue
       FROM   commissions       c
       LEFT   JOIN suppliers    s ON s.supplierID = c.supplierID
       LEFT   JOIN bookings     b ON b.bookingID  = c.bookingID
       LEFT   JOIN employees    e ON e.employeeID = b.employeeID
       ${where}
       ORDER  BY c.createdAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/commissions/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Fixed: removed duplicate JOIN on bookings
    const result = await query(
      `SELECT c.*,
              s.supplierName, s.supplierID,
              e.firstName + ' ' + e.lastName AS agentName,
              e.agentCode,
              b.bookingDate, b.basePrice, b.tripEnd,
              i.totalAmount  AS invoiceTotal,
              i.status       AS invoiceStatus,
              CASE WHEN c.status NOT IN ('paid','cancelled')
                    AND c.dueDate IS NOT NULL
                    AND c.dueDate < GETDATE() THEN 1 ELSE 0 END AS isOverdue
       FROM   commissions c
       JOIN   suppliers   s  ON s.supplierID = c.supplierID
       JOIN   bookings    b  ON b.bookingID  = c.bookingID
       JOIN   employees   e  ON e.employeeID = b.employeeID
       LEFT   JOIN invoices  i  ON i.invoiceID  = c.invoiceID
       WHERE  c.commissionID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!result.recordset[0]) throw httpError(404, 'Commission not found.');

    const payments = await query(
      `SELECT commPaymentID, paymentDate, paymentAmount, paymentMethod,
              processedBy, reference, status, processedBy
       FROM   commission_payments
       WHERE  commissionID = @id
       ORDER  BY paymentDate DESC`,
      { id: { type: sql.Int, value: id } }
    );

    res.json({ ...result.recordset[0], payments: payments.recordset });
  } catch (err) { next(err); }
};

// PUT /api/commissions/:id/approve
// Verifies the commission amount is correct before marking as received
const approve = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE commissions
       SET    status     = 'approved',
              approvedBy = @approver,
              approvedAt = GETDATE(),
              updatedAt  = GETDATE()
       WHERE  commissionID = @id AND status = 'pending'`,
      {
        id:       { type: sql.Int, value: id },
        approver: { type: sql.Int, value: req.user.employeeID },
      }
    );
    await auditLog(req, 'APPROVE', 'commissions', id,
      { status: 'pending' },
      { status: 'approved', approvedBy: req.user.employeeID }
    );
    res.json({ message: 'Commission verified.' });
  } catch (err) { next(err); }
};

// PUT /api/commissions/:id/cancel
const cancel = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE commissions
       SET    status    = 'cancelled',
              updatedAt = GETDATE()
       WHERE  commissionID = @id AND status IN ('pending','approved')`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'CANCEL', 'commissions', id,
      { status: 'pending/approved' },
      { status: 'cancelled' }
    );
    res.json({ message: 'Commission cancelled.' });
  } catch (err) { next(err); }
};

// POST /api/commissions/:id/payments
// Records receipt of commission FROM supplier TO agency
const addPayment = async (req, res, next) => {
  try {
    const commissionID = parseInt(req.params.id);
    const { paymentDate, paymentAmount, paymentMethod,
            processedBy, reference } = req.body;

    if (!paymentAmount || !paymentMethod) {
      throw httpError(400, 'paymentAmount and paymentMethod are required.');
    }

    // Get commission and verify it exists and is approved
    const commResult = await query(
      `SELECT c.supplierID, c.status, c.commissionAmount
       FROM   commissions c
       WHERE  c.commissionID = @id`,
      { id: { type: sql.Int, value: commissionID } }
    );
    if (!commResult.recordset[0]) throw httpError(404, 'Commission not found.');

    const { supplierID, status, commissionAmount } = commResult.recordset[0];

    if (status === 'cancelled') {
      throw httpError(400, 'Cannot record payment for a cancelled commission.');
    }
    if (status === 'paid') {
      throw httpError(400, 'Commission has already been received in full.');
    }

    // Insert payment record — money received FROM supplier
    const insertResult = await query(
      `INSERT INTO commission_payments
         (commissionID, supplierID, paymentDate, paymentAmount,
          paymentMethod, processedBy, reference, status, processedBy)
       OUTPUT INSERTED.commPaymentID
       VALUES
         (@commissionID, @supplierID, @paymentDate, @paymentAmount,
          @paymentMethod, @processedBy, @reference, 'completed', @processedBy)`,
      {
        commissionID:    { type: sql.Int,      value: commissionID },
        supplierID:      { type: sql.Int,      value: supplierID },
        paymentDate:     { type: sql.Date,     value: paymentDate     || new Date() },
        paymentAmount:   { type: sql.Decimal,  value: parseFloat(paymentAmount) },
        paymentMethod:   { type: sql.NVarChar, value: paymentMethod },
        processedBy:    { type: sql.NVarChar, value: processedBy    || null },
        reference: { type: sql.NVarChar, value: reference || null },
        processedBy:     { type: sql.Int,      value: req.user.employeeID },
      }
    );

    const newPaymentID = insertResult.recordset[0].commPaymentID;

    // Mark commission as paid (fully received from supplier)
    await query(
      `UPDATE commissions
       SET    status    = 'paid',
              updatedAt = GETDATE()
       WHERE  commissionID = @id`,
      { id: { type: sql.Int, value: commissionID } }
    );

    await auditLog(req, 'ADD_PAYMENT', 'commission_payments', newPaymentID,
      null,
      { commissionID, supplierID, paymentAmount, paymentMethod,
        processedBy, reference }
    );

    res.status(201).json({ message: 'Commission receipt recorded.' });
  } catch (err) { next(err); }
};

export { getStats, getAll, getById, approve, cancel, addPayment };