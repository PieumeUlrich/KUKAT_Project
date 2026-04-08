import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';

// GET /api/commissions/stats
const getStats = async (req, res, next) => {
  try {
    const params = {};
    const conditions = [];
    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('c.employeeID = @empID');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT
         COUNT(*)                                                                       AS total,
         SUM(CASE WHEN c.status = 'pending'  THEN 1 ELSE 0 END)                       AS pending,
         SUM(CASE WHEN c.status = 'approved' THEN 1 ELSE 0 END)                       AS approved,
         SUM(CASE WHEN c.status = 'paid'     THEN 1 ELSE 0 END)                       AS paid,
         SUM(CASE WHEN c.status = 'cancelled' THEN 1 ELSE 0 END)                      AS cancelled,
         ISNULL(SUM(CASE WHEN c.status = 'paid' THEN c.commissionAmount ELSE 0 END), 0) AS totalPaid,
         ISNULL(SUM(CASE WHEN c.status = 'pending' THEN c.commissionAmount ELSE 0 END), 0) AS totalPending,
         SUM(CASE WHEN cp.isBonus = 1 THEN 1 ELSE 0 END)                              AS bonusCount
       FROM commissions c
       LEFT JOIN commission_payments cp ON cp.commissionID = c.commissionID
       ${where}`, params
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

    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('c.employeeID = @empID');
    }
    if (status) {
      params.status = { type: sql.NVarChar, value: status };
      conditions.push('c.status = @status');
    }
    const searchClause = buildSearch(search, [
      'e.firstName', 'e.lastName', 'CAST(c.bookingID AS NVARCHAR)'
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM commissions c
       JOIN employees e ON e.employeeID = c.employeeID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT c.commissionID, c.bookingID, c.invoiceID,
              c.commissionRate, c.commissionAmount, c.status,
              c.approvedAt, c.createdAt,
              e.firstName + ' ' + e.lastName AS agentName,
              e.agentCode, e.employeeID,
              ISNULL(cp.isBonus, 0) AS isBonus
       FROM   commissions c
       JOIN   employees   e  ON e.employeeID   = c.employeeID
       LEFT   JOIN commission_payments cp ON cp.commissionID = c.commissionID
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
    const result = await query(
      `SELECT c.*,
              e.firstName + ' ' + e.lastName AS agentName, e.agentCode,
              b.bookingDate, b.basePrice,
              i.totalAmount AS invoiceTotal, i.status AS invoiceStatus
       FROM   commissions c
       JOIN   employees   e ON e.employeeID = c.employeeID
       LEFT   JOIN bookings  b ON b.bookingID  = c.bookingID
       LEFT   JOIN invoices  i ON i.invoiceID  = c.invoiceID
       WHERE  c.commissionID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!result.recordset[0]) throw httpError(404, 'Commission not found.');

    const payments = await query(
      `SELECT commPaymentID, paymentDate, paymentAmount, paymentMethod,
              reference, status, isBonus, bonusReason
       FROM   commission_payments WHERE commissionID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    res.json({ ...result.recordset[0], payments: payments.recordset });
  } catch (err) { next(err); }
};

// PUT /api/commissions/:id/approve
const approve = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE commissions
       SET    status = 'approved', approvedBy = @approver,
              approvedAt = GETDATE(), updatedAt = GETDATE()
       WHERE  commissionID = @id AND status = 'pending'`,
      {
        id:       { type: sql.Int, value: id },
        approver: { type: sql.Int, value: req.user.employeeID },
      }
    );
    res.json({ message: 'Commission approved.' });
  } catch (err) { next(err); }
};

// PUT /api/commissions/:id/cancel
const cancel = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE commissions SET status = 'cancelled', updatedAt = GETDATE()
       WHERE  commissionID = @id AND status IN ('pending','approved')`,
      { id: { type: sql.Int, value: id } }
    );
    res.json({ message: 'Commission cancelled.' });
  } catch (err) { next(err); }
};

// POST /api/commissions/:id/payments
const addPayment = async (req, res, next) => {
  try {
    const commissionID = parseInt(req.params.id);
    const { paymentDate, paymentAmount, paymentMethod, reference, isBonus, bonusReason } = req.body;
    if (!paymentAmount || !paymentMethod) {
      throw httpError(400, 'paymentAmount and paymentMethod are required.');
    }
    const commResult = await query(
      `SELECT employeeID FROM commissions WHERE commissionID = @id`,
      { id: { type: sql.Int, value: commissionID } }
    );
    if (!commResult.recordset[0]) throw httpError(404, 'Commission not found.');
    const { employeeID } = commResult.recordset[0];

    await query(
      `INSERT INTO commission_payments
         (commissionID, employeeID, paymentDate, paymentAmount, paymentMethod,
          reference, status, isBonus, bonusReason, processedBy)
       VALUES
         (@commissionID, @employeeID, @paymentDate, @paymentAmount, @paymentMethod,
          @reference, 'completed', @isBonus, @bonusReason, @processedBy)`,
      {
        commissionID:  { type: sql.Int,      value: commissionID },
        employeeID:    { type: sql.Int,      value: employeeID },
        paymentDate:   { type: sql.Date,     value: paymentDate   || new Date() },
        paymentAmount: { type: sql.Decimal,  value: parseFloat(paymentAmount) },
        paymentMethod: { type: sql.NVarChar, value: paymentMethod },
        reference:     { type: sql.NVarChar, value: reference     || null },
        isBonus:       { type: sql.Bit,      value: isBonus ? 1 : 0 },
        bonusReason:   { type: sql.NVarChar, value: bonusReason   || null },
        processedBy:   { type: sql.Int,      value: req.user.employeeID },
      }
    );
    await query(
      `UPDATE commissions SET status = 'paid', updatedAt = GETDATE()
       WHERE  commissionID = @id`,
      { id: { type: sql.Int, value: commissionID } }
    );
    res.status(201).json({ message: 'Commission payment recorded.' });
  } catch (err) { next(err); }
};

export { getStats, getAll, getById, approve, cancel, addPayment };
