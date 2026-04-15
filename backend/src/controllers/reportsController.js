import { query, sql } from '../config/db.js';

// ── Date range helper ─────────────────────────────────────────
const dateRange = (period) => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'month': {
      // Last 30 days
      const start = new Date(now); start.setDate(start.getDate() - 30);
      return { start, end: now };
    }
    case 'quarter': {
      // Last 90 days
      const start = new Date(now); start.setDate(start.getDate() - 90);
      return { start, end: now };
    }
    case 'year': {
      // Last 12 months
      const start = new Date(now); start.setFullYear(start.getFullYear() - 1);
      return { start, end: now };
    }
    default:
      // All time
      return { start: new Date('2000-01-01'), end: new Date('2099-12-31') };
  }
};

const dateParams = (period) => {
  const { start, end } = dateRange(period);
  return {
    start: { type: sql.Date, value: start },
    end:   { type: sql.Date, value: end   },
  };
};

// GET /api/reports/revenue
const getRevenueSummary = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);
    const result = await query(
      `SELECT
         COUNT(DISTINCT i.invoiceID)                                                   AS totalInvoices,
         ISNULL(SUM(CASE WHEN i.status = 'paid'    THEN i.totalAmount ELSE 0 END), 0) AS total,
         ISNULL(SUM(CASE WHEN i.status = 'unpaid'  THEN i.totalAmount ELSE 0 END), 0) AS outstanding,
         ISNULL(AVG(b.basePrice), 0)                                                   AS avgBooking
       FROM invoices i
       JOIN bookings b ON b.bookingID = i.bookingID
       WHERE i.invoiceDate BETWEEN @start AND @end`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/reports/bookings
const getBookingStats = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);

    const [bookResult, commResult] = await Promise.all([
      query(
        `SELECT
           COUNT(*)                                                                    AS total,
           SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)                    AS confirmed,
           SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END)                    AS pending,
           SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END)                    AS completed,
           SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)                    AS cancelled,
           ISNULL(SUM(CASE WHEN status != 'cancelled' THEN basePrice ELSE 0 END), 0) AS totalRevenue
         FROM bookings
         WHERE bookingDate BETWEEN @start AND @end`, params
      ),
      query(
        `SELECT ISNULL(SUM(cp.paymentAmount), 0) AS totalCommissions
         FROM   commission_payments cp
         JOIN   commissions c ON c.commissionID = cp.commissionID
         JOIN   bookings    b ON b.bookingID    = c.bookingID
         WHERE  b.bookingDate BETWEEN @start AND @end`, params
      ),
    ]);

    res.json({
      ...bookResult.recordset[0],
      totalCommissions: commResult.recordset[0].totalCommissions,
    });
  } catch (err) { next(err); }
};

// GET /api/reports/agents
const getAgentPerformance = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);
    const result = await query(
      `SELECT
         e.employeeID, e.firstName, e.lastName, e.agentCode,
         COUNT(DISTINCT b.bookingID)      AS bookingCount,
         ISNULL(SUM(b.basePrice), 0)      AS revenue,
         ISNULL(SUM(c.commissionAmount), 0) AS commission
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID AND r.roleName = 'agent'
       LEFT   JOIN bookings    b ON b.employeeID = e.employeeID
                               AND b.bookingDate BETWEEN @start AND @end
                               AND b.status != 'cancelled'
       LEFT   JOIN commissions c ON c.employeeID = e.employeeID
                               AND c.createdAt   BETWEEN @start AND @end
       WHERE  e.isActive = 1
       GROUP  BY e.employeeID, e.firstName, e.lastName, e.agentCode
       ORDER  BY bookingCount DESC`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// GET /api/reports/top-destinations
const getTopDestinations = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);
    const result = await query(
      `SELECT TOP 10
         d.destinationID, d.destinationName, d.region,
         COUNT(b.bookingID)           AS bookingCount,
         ISNULL(SUM(b.basePrice), 0)  AS totalRevenue
       FROM   destinations d
       JOIN   bookings     b ON b.destinationID = d.destinationID
                            AND b.bookingDate BETWEEN @start AND @end
                            AND b.status != 'cancelled'
       GROUP  BY d.destinationID, d.destinationName, d.region
       ORDER  BY bookingCount DESC`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// GET /api/reports/commissions
const getCommissionReport = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);
    const result = await query(
      `SELECT
         ISNULL(SUM(CASE WHEN status = 'paid'     THEN commissionAmount ELSE 0 END), 0) AS paid,
         ISNULL(SUM(CASE WHEN status = 'pending'  THEN commissionAmount ELSE 0 END), 0) AS pending,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)                                  AS pendingCount,
         COUNT(*)                                                                         AS total
       FROM commissions
       WHERE createdAt BETWEEN @start AND @end`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/reports/top-products
const getTopProducts = async (req, res, next) => {
  try {
    const params = dateParams(req.query.period);
    const result = await query(
      `SELECT TOP 10
         p.productID, p.productName, s.supplierName,
         COUNT(b.bookingID)          AS bookingCount,
         ISNULL(SUM(b.basePrice), 0) AS revenue
       FROM   products  p
       JOIN   suppliers s ON s.supplierID = p.supplierID
       JOIN   bookings  b ON b.productID  = p.productID
                         AND b.bookingDate BETWEEN @start AND @end
                         AND b.status != 'cancelled'
       GROUP  BY p.productID, p.productName, s.supplierName
       ORDER  BY bookingCount DESC`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};



// GET /api/reports/revenue-trend
// Returns monthly revenue/bookings breakdown for charts
const getRevenueTrend = async (req, res, next) => {
  try {
    const { period = 'year' } = req.query;
    const { start, end } = dateRange(period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

    const result = await query(
      `SELECT
         YEAR(b.bookingDate)                                                  AS year,
         MONTH(b.bookingDate)                                                 AS month,
         DATENAME(MONTH, b.bookingDate) + ' ' + CAST(YEAR(b.bookingDate) AS VARCHAR) AS label,
         COUNT(*)                                                             AS bookings,
         ISNULL(SUM(CASE WHEN b.status != 'cancelled' THEN b.basePrice ELSE 0 END), 0) AS revenue,
         ISNULL(SUM(CASE WHEN i.status = 'paid' THEN i.totalAmount ELSE 0 END), 0)     AS collected
       FROM   bookings b
       LEFT   JOIN invoices i ON i.bookingID = b.bookingID
       WHERE  b.bookingDate BETWEEN @start AND @end
       GROUP  BY YEAR(b.bookingDate), MONTH(b.bookingDate),
                 DATENAME(MONTH, b.bookingDate) + ' ' + CAST(YEAR(b.bookingDate) AS VARCHAR)
       ORDER  BY year, month`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

export {
  getRevenueSummary, getBookingStats, getAgentPerformance,
  getTopDestinations, getCommissionReport, getTopProducts, getRevenueTrend,
};
