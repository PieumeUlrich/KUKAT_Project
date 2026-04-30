import { query, sql } from '../config/db.js';

const dateRange = (period) => {
  const now = new Date();
  switch (period) {
    case 'month':   { const s = new Date(now); s.setDate(s.getDate() - 30);        return { start: s, end: now }; }
    case 'quarter': { const s = new Date(now); s.setDate(s.getDate() - 90);        return { start: s, end: now }; }
    case 'year':    { const s = new Date(now); s.setFullYear(s.getFullYear() - 1); return { start: s, end: now }; }
    default:        return { start: new Date('2000-01-01'), end: new Date('2099-12-31') };
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const empID    = req.user.employeeID;
    const { start, end } = dateRange(req.query.period);

    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];
    const dateFilter = `b.bookingDate BETWEEN '${startStr}' AND '${endStr}'`;

    let queries = [];

    // ── Superadmin / Manager ──────────────────────────────────
    if (['superadmin', 'manager'].includes(userRole)) {
      queries = [
        // Booking KPIs
        query(`
          SELECT
            COUNT(*)                                                                    AS total,
            SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)                    AS confirmed,
            SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END)                    AS pending,
            SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END)                    AS completed,
            SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)                    AS cancelled,
            ISNULL(SUM(CASE WHEN status != 'cancelled' THEN basePrice ELSE 0 END), 0) AS totalRevenue,
            SUM(CASE WHEN MONTH(bookingDate) = MONTH(GETDATE())
                      AND YEAR(bookingDate)  = YEAR(GETDATE()) THEN 1 ELSE 0 END)     AS thisMonth
          FROM bookings b WHERE ${dateFilter}`
        ),

        // Invoice KPIs
        query(`
          SELECT
            COUNT(*)                                                                      AS total,
            SUM(CASE WHEN i.status = 'paid'    THEN 1 ELSE 0 END)                       AS paid,
            SUM(CASE WHEN i.status = 'unpaid'  THEN 1 ELSE 0 END)                       AS unpaid,
            SUM(CASE WHEN i.status = 'partial' THEN 1 ELSE 0 END)                       AS partial,
            ISNULL(SUM(CASE WHEN i.status = 'paid'   THEN i.totalAmount ELSE 0 END), 0) AS totalCollected,
            ISNULL(SUM(CASE WHEN i.status = 'unpaid' THEN i.totalAmount ELSE 0 END), 0) AS totalOutstanding
          FROM invoices i`
        ),

        // Commission KPIs — agency revenue from suppliers (no agent filter)
        query(`
          SELECT
            COUNT(*)                                                                           AS total,
            SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END)                             AS pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)                             AS approved,
            SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END)                             AS paid,
            ISNULL(SUM(CASE WHEN status = 'paid'    THEN commissionAmount ELSE 0 END), 0)    AS totalPaid,
            ISNULL(SUM(CASE WHEN status = 'pending' THEN commissionAmount ELSE 0 END), 0)    AS totalPending,
            SUM(CASE WHEN status NOT IN ('paid','cancelled')
                      AND dueDate IS NOT NULL
                      AND dueDate < GETDATE() THEN 1 ELSE 0 END)                             AS overdueCount
          FROM commissions c`
        ),

        // Customer KPIs
        query(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN MONTH(createdAt) = MONTH(GETDATE())
                      AND YEAR(createdAt)  = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS newThisMonth
          FROM customers`
        ),

        // Recent bookings (last 8)
        query(`
          SELECT TOP 8
            b.bookingID, b.bookingDate, b.status, b.basePrice,
            c.firstName + ' ' + c.lastName AS customerName,
            p.productName,
            e.firstName + ' ' + e.lastName AS agentName
          FROM   bookings  b
          JOIN   customers c ON c.customerID = b.customerID
          JOIN   products  p ON p.productID  = b.productID
          JOIN   employees e ON e.employeeID = b.employeeID
          WHERE  ${dateFilter}
          ORDER  BY b.bookingDate DESC`
        ),

        // Recent payments (last 6)
        query(`
          SELECT TOP 6
            py.paymentID, py.paymentDate, py.amountPaid, py.paymentMethod,
            py.status, i.invoiceID,
            c.firstName + ' ' + c.lastName AS customerName
          FROM   payments  py
          JOIN   invoices  i ON i.invoiceID  = py.invoiceID
          JOIN   bookings  b ON b.bookingID  = i.bookingID
          JOIN   customers c ON c.customerID = b.customerID
          ORDER  BY py.paymentDate DESC`
        ),

        // Pending commissions from suppliers (top 5)
        query(`
          SELECT TOP 5
            c.commissionID, c.commissionAmount, c.commissionRate,
            c.createdAt, c.dueDate,
            s.supplierName,
            e.firstName + ' ' + e.lastName AS agentName,
            e.agentCode
          FROM   commissions c
          JOIN   suppliers   s ON s.supplierID = c.supplierID
          JOIN   bookings    b ON b.bookingID  = c.bookingID
          JOIN   employees   e ON e.employeeID = b.employeeID
          WHERE  c.status = 'pending'
          ORDER  BY c.createdAt DESC`
        ),
      ];
    }

    // ── HR ────────────────────────────────────────────────────
    else if (userRole === 'hr') {
      queries = [
        query(`
          SELECT
            COUNT(*) AS totalEmployees,
            SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeEmployees,
            SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS inactiveEmployees,
            SUM(CASE WHEN DATEDIFF(MONTH, hireDate, GETDATE()) <= 12 THEN 1 ELSE 0 END) AS newHiresThisYear
          FROM employees`
        ),
        query(`
          SELECT r.roleName, COUNT(e.employeeID) AS count
          FROM   employees e
          JOIN   roles r ON r.roleID = e.roleID
          GROUP  BY r.roleName
          ORDER  BY count DESC`
        ),
        query(`
          SELECT TOP 10
            e.employeeID,
            e.firstName + ' ' + e.lastName AS employeeName,
            e.agentCode,
            COUNT(b.bookingID)          AS bookingCount,
            ISNULL(SUM(b.basePrice), 0) AS totalRevenue
          FROM employees e
          LEFT JOIN bookings b ON b.employeeID = e.employeeID
                               AND b.bookingDate BETWEEN '${startStr}' AND '${endStr}'
          GROUP  BY e.employeeID, e.firstName, e.lastName, e.agentCode
          ORDER  BY totalRevenue DESC`
        ),
        query(`
          SELECT
            COUNT(DISTINCT e.employeeID) AS totalAgents,
            AVG(CAST(bookingCount AS FLOAT)) AS avgBookingsPerAgent,
            MAX(bookingCount)            AS maxBookingsByAgent
          FROM (
            SELECT e.employeeID, COUNT(b.bookingID) AS bookingCount
            FROM   employees e
            LEFT   JOIN bookings b ON b.employeeID = e.employeeID
                                   AND b.bookingDate BETWEEN '${startStr}' AND '${endStr}'
            WHERE  e.roleID = 3
            GROUP  BY e.employeeID
          ) agentStats`
        ),
      ];
    }

    // ── Accountant ────────────────────────────────────────────
    else if (userRole === 'accountant') {
      queries = [
        query(`
          SELECT
            COUNT(*) AS totalInvoices,
            ISNULL(SUM(CASE WHEN status = 'paid'    THEN totalAmount ELSE 0 END), 0) AS totalCollected,
            ISNULL(SUM(CASE WHEN status = 'unpaid'  THEN totalAmount ELSE 0 END), 0) AS totalOutstanding,
            ISNULL(SUM(CASE WHEN status = 'partial' THEN totalAmount ELSE 0 END), 0) AS totalPartial
          FROM invoices`
        ),
        query(`
          SELECT
            paymentMethod,
            COUNT(*) AS transactionCount,
            ISNULL(SUM(amountPaid), 0) AS totalAmount
          FROM payments
          WHERE paymentDate BETWEEN '${startStr}' AND '${endStr}'
          GROUP BY paymentMethod
          ORDER BY totalAmount DESC`
        ),
        // Commission KPIs — agency income from suppliers
        query(`
          SELECT
            COUNT(*) AS totalCommissions,
            ISNULL(SUM(CASE WHEN status = 'paid'    THEN commissionAmount ELSE 0 END), 0) AS totalPaidCommissions,
            ISNULL(SUM(CASE WHEN status = 'pending' THEN commissionAmount ELSE 0 END), 0) AS pendingCommissions,
            AVG(commissionRate) AS avgCommissionRate,
            SUM(CASE WHEN status NOT IN ('paid','cancelled')
                      AND dueDate IS NOT NULL
                      AND dueDate < GETDATE() THEN 1 ELSE 0 END)                          AS overdueCount
          FROM commissions`
        ),
        query(`
          SELECT
            YEAR(paymentDate)  AS year,
            MONTH(paymentDate) AS month,
            ISNULL(SUM(amountPaid), 0) AS monthlyRevenue
          FROM payments
          WHERE paymentDate >= DATEADD(MONTH, -12, GETDATE())
          GROUP  BY YEAR(paymentDate), MONTH(paymentDate)
          ORDER  BY year DESC, month DESC`
        ),
        query(`
          SELECT TOP 10
            i.invoiceID, i.totalAmount, i.status,
            c.firstName + ' ' + c.lastName AS customerName,
            DATEDIFF(DAY, i.createdAt, GETDATE()) AS daysOutstanding
          FROM   invoices   i
          JOIN   bookings   b ON b.bookingID  = i.bookingID
          JOIN   customers  c ON c.customerID = b.customerID
          WHERE  i.status IN ('unpaid', 'partial')
          ORDER  BY i.createdAt ASC`
        ),
      ];
    }

    // ── Agent ─────────────────────────────────────────────────
    else if (userRole === 'agent') {
      queries = [
        // Booking KPIs — agent's own bookings only
        query(`
          SELECT
            COUNT(*)                                                                    AS total,
            SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)                    AS confirmed,
            SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END)                    AS pending,
            SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END)                    AS completed,
            SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)                    AS cancelled,
            ISNULL(SUM(CASE WHEN status != 'cancelled' THEN basePrice ELSE 0 END), 0) AS totalRevenue,
            SUM(CASE WHEN MONTH(bookingDate) = MONTH(GETDATE())
                      AND YEAR(bookingDate)  = YEAR(GETDATE()) THEN 1 ELSE 0 END)     AS thisMonth
          FROM bookings b
          WHERE b.employeeID = ${empID}
          AND   b.bookingDate BETWEEN '${startStr}' AND '${endStr}'`
        ),

        // Customer KPIs — agent's assigned customers only
        // Commissions removed from agent dashboard — commissions are agency revenue
        query(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN MONTH(createdAt) = MONTH(GETDATE())
                      AND YEAR(createdAt)  = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS newThisMonth
          FROM customers
          WHERE assignedAgentID = ${empID}`
        ),

        // Invoice KPIs — agent's bookings only
        query(`
          SELECT
            COUNT(*)                                                                      AS total,
            SUM(CASE WHEN i.status = 'paid'    THEN 1 ELSE 0 END)                       AS paid,
            SUM(CASE WHEN i.status = 'unpaid'  THEN 1 ELSE 0 END)                       AS unpaid,
            ISNULL(SUM(CASE WHEN i.status = 'paid' THEN i.totalAmount ELSE 0 END), 0)   AS totalCollected
          FROM   invoices i
          JOIN   bookings b ON b.bookingID = i.bookingID
          WHERE  b.employeeID = ${empID}`
        ),

        // Recent bookings — agent's only
        query(`
          SELECT TOP 8
            b.bookingID, b.bookingDate, b.status, b.basePrice, b.tripStart,
            c.firstName + ' ' + c.lastName AS customerName,
            p.productName
          FROM   bookings  b
          JOIN   customers c ON c.customerID = b.customerID
          JOIN   products  p ON p.productID  = b.productID
          WHERE  b.employeeID = ${empID}
          ORDER  BY b.bookingDate DESC`
        ),
      ];
    }

    const results = await Promise.all(queries);

    // ── Build response ────────────────────────────────────────
    let response = {};

    if (['superadmin', 'manager'].includes(userRole)) {
      response = {
        bookings:           results[0].recordset[0],
        invoices:           results[1].recordset[0],
        commissions:        results[2].recordset[0],
        customers:          results[3].recordset[0],
        recentBookings:     results[4].recordset,
        recentPayments:     results[5].recordset,
        pendingCommissions: results[6].recordset,
      };
    }
    else if (userRole === 'hr') {
      response = {
        employeeStats:       results[0].recordset[0],
        roleDistribution:    results[1].recordset,
        employeePerformance: results[2].recordset,
        agentMetrics:        results[3].recordset[0],
      };
    }
    else if (userRole === 'accountant') {
      response = {
        financialOverview:   results[0].recordset[0],
        paymentMethods:      results[1].recordset,
        commissionPayments:  results[2].recordset[0],
        revenueTrend:        results[3].recordset,
        outstandingInvoices: results[4].recordset,
      };
    }
    else if (userRole === 'agent') {
      response = {
        bookings:       results[0].recordset[0],
        customers:      results[1].recordset[0],
        invoices:       results[2].recordset[0],
        recentBookings: results[3].recordset,
      };
    }

    res.json(response);
  } catch (err) { next(err); }
};

export { getDashboard };