import { query, sql } from '../config/db.js';

// Helper — date range from period string
const dateRange = (period) => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'month':
      return {
        start: new Date(year, month, 1),
        end:   new Date(year, month + 1, 0),
      };
    case 'quarter': {
      const q = Math.floor(month / 3);
      return {
        start: new Date(year, q * 3, 1),
        end:   new Date(year, q * 3 + 3, 0),
      };
    }
    case 'year':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    default:
      return { start: new Date('2000-01-01'), end: new Date('2099-12-31') };
  }
}

// GET /api/reports/revenue
const getRevenueSummary = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query.period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

    const result = await query(
      `SELECT
         COUNT(DISTINCT i.invoiceID)                                AS totalInvoices,
         ISNULL(SUM(CASE WHEN i.status = 'paid' THEN i.totalAmount ELSE 0 END), 0) AS total,
         ISNULL(AVG(b.basePrice), 0)                               AS avgBooking,
         ISNULL(SUM(CASE WHEN i.status = 'unpaid' THEN i.totalAmount ELSE 0 END), 0) AS outstanding
       FROM   invoices i
       JOIN   bookings b ON b.bookingID = i.bookingID
       WHERE  i.invoiceDate BETWEEN @start AND @end`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
}

// GET /api/reports/bookings
const getBookingStats = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query.period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

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
    const { start, end } = dateRange(req.query.period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

    const result = await query(
      `SELECT
         e.employeeID, e.firstName, e.lastName, e.agentCode,
         COUNT(DISTINCT b.bookingID)                                   AS bookingCount,
         ISNULL(SUM(b.basePrice), 0)                                   AS revenue,
         ISNULL(SUM(c.commissionAmount), 0)                            AS commission
       FROM   employees e
       JOIN   roles     r ON r.roleID    = e.roleID AND r.roleName = 'agent'
       LEFT   JOIN bookings    b ON b.employeeID   = e.employeeID
                                AND b.bookingDate BETWEEN @start AND @end
                                AND b.status != 'cancelled'
       LEFT   JOIN commissions c ON c.employeeID   = e.employeeID
                                AND c.createdAt   BETWEEN @start AND @end
       WHERE  e.isActive = 1
       GROUP  BY e.employeeID, e.firstName, e.lastName, e.agentCode
       ORDER  BY bookingCount DESC`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

// GET /api/reports/top-destinations
const getTopDestinations = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query.period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

    const result = await query(
      `SELECT TOP 10
         d.destinationID, d.destinationName, d.region,
         COUNT(b.bookingID)        AS bookingCount,
         ISNULL(SUM(b.basePrice), 0) AS totalRevenue
       FROM   destinations d
       JOIN   bookings     b ON b.destinationID = d.destinationID
                            AND b.bookingDate BETWEEN @start AND @end
                            AND b.status != 'cancelled'
       GROUP  BY d.destinationID, d.destinationName, d.region
       ORDER  BY bookingCount DESC`, params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

// GET /api/reports/commissions
const getCommissionReport = async (req, res, next) => {
  try {
    const { start, end } = dateRange(req.query.period);
    const params = {
      start: { type: sql.Date, value: start },
      end:   { type: sql.Date, value: end   },
    };

    const result = await query(
      `SELECT
         SUM(CASE WHEN status = 'paid'    THEN commissionAmount ELSE 0 END) AS paid,
         SUM(CASE WHEN status = 'pending' THEN commissionAmount ELSE 0 END) AS pending,
         COUNT(CASE WHEN status = 'pending' THEN 1 END)                     AS pendingCount,
         COUNT(*)                                                            AS total
       FROM   commissions
       WHERE  createdAt BETWEEN @start AND @end`, params
    );

    res.json(result.recordset[0]);
  } catch (err) { next(err); }
}

export {
  getRevenueSummary, getBookingStats, getAgentPerformance,
  getTopDestinations, getCommissionReport,
};
