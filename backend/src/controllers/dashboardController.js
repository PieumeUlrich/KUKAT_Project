import { query, sql } from '../config/db.js';

const dateRange = (period) => {
  const now = new Date();
  switch (period) {
    case 'month':   { const s = new Date(now); s.setDate(s.getDate() - 30);   return { start: s, end: now }; }
    case 'quarter': { const s = new Date(now); s.setDate(s.getDate() - 90);   return { start: s, end: now }; }
    case 'year':    { const s = new Date(now); s.setFullYear(s.getFullYear() - 1); return { start: s, end: now }; }
    default:        return { start: new Date('2000-01-01'), end: new Date('2099-12-31') };
  }
};

// GET /api/dashboard
// Returns all KPIs needed for the dashboard in one request
const getDashboard = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const empID    = req.user.employeeID;
    const { start, end } = dateRange(req.query.period);

    const dateFilter  = `b.bookingDate BETWEEN '${start.toISOString().split('T')[0]}' AND '${end.toISOString().split('T')[0]}'`;
    const agentBookingFilter    = userRole === 'agent' ? `WHERE ${dateFilter} AND b.employeeID = ${empID}` : `WHERE ${dateFilter}`;
    const agentCommissionFilter = userRole === 'agent' ? `WHERE c.employeeID = ${empID}` : '';
    const agentCustomerFilter   = userRole === 'agent' ? `WHERE assignedAgentID = ${empID}` : '';

    let queries = [];
    let queryNames = [];

    // Base queries for all roles
    if (['superadmin', 'manager', 'accountant'].includes(userRole)) {
      queries = [
        // Booking KPIs
        query(`
          SELECT
            COUNT(*)                                                              AS total,
            SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)              AS confirmed,
            SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END)              AS pending,
            SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END)              AS completed,
            SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)              AS cancelled,
            ISNULL(SUM(CASE WHEN status != 'cancelled' THEN basePrice ELSE 0 END), 0) AS totalRevenue,
            SUM(CASE WHEN MONTH(bookingDate) = MONTH(GETDATE())
                      AND YEAR(bookingDate)  = YEAR(GETDATE())  THEN 1 ELSE 0 END) AS thisMonth
          FROM bookings b ${agentBookingFilter}`
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
          FROM invoices i
          ${userRole === 'agent' ? `JOIN bookings b ON b.bookingID = i.bookingID WHERE b.employeeID = ${empID}` : ''}`
        ),

        // Commission KPIs
        query(`
          SELECT
            COUNT(*)                                                                           AS total,
            SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END)                             AS pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)                             AS approved,
            SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END)                             AS paid,
            ISNULL(SUM(CASE WHEN status = 'paid'    THEN commissionAmount ELSE 0 END), 0)    AS totalPaid,
            ISNULL(SUM(CASE WHEN status = 'pending' THEN commissionAmount ELSE 0 END), 0)    AS totalPending
          FROM commissions c ${agentCommissionFilter}`
        ),

        // Customer KPIs
        query(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN MONTH(createdAt) = MONTH(GETDATE())
                      AND YEAR(createdAt)  = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS newThisMonth
          FROM customers ${agentCustomerFilter}`
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
          ${agentBookingFilter}
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
          ${userRole === 'agent' ? `WHERE b.employeeID = ${empID}` : ''}
          ORDER  BY py.paymentDate DESC`
        ),

        // Pending commissions awaiting approval
        query(`
          SELECT TOP 5
            c.commissionID, c.commissionAmount, c.commissionRate, c.createdAt,
            e.firstName + ' ' + e.lastName AS agentName,
            e.agentCode
          FROM   commissions c
          JOIN   employees   e ON e.employeeID = c.employeeID
          WHERE  c.status = 'pending'
          ${userRole === 'agent' ? `AND c.employeeID = ${empID}` : ''}
          ORDER  BY c.createdAt DESC`
        ),
      ];
      queryNames = ['bookingStats', 'invoiceStats', 'commissionStats', 'customerStats', 'recentBookings', 'recentPayments', 'pendingCommissions'];
    }
    else if (userRole === 'hr') {
      // HR Dashboard - Employee focused metrics
      queries = [
        // Employee statistics
        query(`
          SELECT
            COUNT(*) AS totalEmployees,
            SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) AS activeEmployees,
            SUM(CASE WHEN isActive = 0 THEN 1 ELSE 0 END) AS inactiveEmployees,
            SUM(CASE WHEN DATEDIFF(MONTH, hireDate, GETDATE()) <= 12 THEN 1 ELSE 0 END) AS newHiresThisYear
          FROM employees`
        ),

        // Employee distribution by role
        query(`
          SELECT
            r.roleName,
            COUNT(e.employeeID) AS count
          FROM employees e
          JOIN roles r ON r.roleID = e.roleID
          GROUP BY r.roleName
          ORDER BY count DESC`
        ),

        // Recent employee activities (bookings by employees)
        query(`
          SELECT TOP 10
            e.employeeID,
            e.firstName + ' ' + e.lastName AS employeeName,
            e.agentCode,
            COUNT(b.bookingID) AS bookingCount,
            ISNULL(SUM(b.basePrice), 0) AS totalRevenue
          FROM employees e
          LEFT JOIN bookings b ON b.employeeID = e.employeeID AND ${dateFilter.replace('b.', '')}
          GROUP BY e.employeeID, e.firstName, e.lastName, e.agentCode
          ORDER BY totalRevenue DESC`
        ),

        // Employee performance metrics
        query(`
          SELECT
            COUNT(DISTINCT e.employeeID) AS totalAgents,
            AVG(bookingCount) AS avgBookingsPerAgent,
            MAX(bookingCount) AS maxBookingsByAgent
          FROM (
            SELECT
              e.employeeID,
              COUNT(b.bookingID) AS bookingCount
            FROM employees e
            LEFT JOIN bookings b ON b.employeeID = e.employeeID AND ${dateFilter.replace('b.', '')}
            WHERE e.roleID = 3  -- Agent role
            GROUP BY e.employeeID
          ) agentStats`
        ),
      ];
      queryNames = ['employeeStats', 'roleDistribution', 'employeePerformance', 'agentMetrics'];
    }
    else if (userRole === 'accountant') {
      // Accountant Dashboard - Financial focused metrics
      queries = [
        // Financial overview
        query(`
          SELECT
            COUNT(*) AS totalInvoices,
            ISNULL(SUM(CASE WHEN status = 'paid' THEN totalAmount ELSE 0 END), 0) AS totalCollected,
            ISNULL(SUM(CASE WHEN status = 'unpaid' THEN totalAmount ELSE 0 END), 0) AS totalOutstanding,
            ISNULL(SUM(CASE WHEN status = 'partial' THEN totalAmount ELSE 0 END), 0) AS totalPartial
          FROM invoices`
        ),

        // Payment methods breakdown
        query(`
          SELECT
            paymentMethod,
            COUNT(*) AS transactionCount,
            ISNULL(SUM(amountPaid), 0) AS totalAmount
          FROM payments
          WHERE paymentDate BETWEEN '${start.toISOString().split('T')[0]}' AND '${end.toISOString().split('T')[0]}'
          GROUP BY paymentMethod
          ORDER BY totalAmount DESC`
        ),

        // Commission payments
        query(`
          SELECT
            COUNT(*) AS totalCommissions,
            ISNULL(SUM(CASE WHEN status = 'paid' THEN commissionAmount ELSE 0 END), 0) AS totalPaidCommissions,
            ISNULL(SUM(CASE WHEN status = 'pending' THEN commissionAmount ELSE 0 END), 0) AS pendingCommissions,
            AVG(commissionRate) AS avgCommissionRate
          FROM commissions`
        ),

        // Monthly revenue trend (last 12 months)
        query(`
          SELECT
            YEAR(paymentDate) AS year,
            MONTH(paymentDate) AS month,
            ISNULL(SUM(amountPaid), 0) AS monthlyRevenue
          FROM payments
          WHERE paymentDate >= DATEADD(MONTH, -12, GETDATE())
          GROUP BY YEAR(paymentDate), MONTH(paymentDate)
          ORDER BY year DESC, month DESC`
        ),

        // Outstanding invoices
        query(`
          SELECT TOP 10
            i.invoiceID,
            i.totalAmount,
            i.status,
            c.firstName + ' ' + c.lastName AS customerName,
            DATEDIFF(DAY, i.createdAt, GETDATE()) AS daysOutstanding
          FROM invoices i
          JOIN bookings b ON b.bookingID = i.bookingID
          JOIN customers c ON c.customerID = b.customerID
          WHERE i.status IN ('unpaid', 'partial')
          ORDER BY i.createdAt ASC`
        ),
      ];
      queryNames = ['financialOverview', 'paymentMethods', 'commissionPayments', 'revenueTrend', 'outstandingInvoices'];
    }

    const results = await Promise.all(queries);

    // Build response based on role
    let response = {};

    if (['superadmin', 'manager', 'accountant'].includes(userRole)) {
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
        financialOverview:    results[0].recordset[0],
        paymentMethods:       results[1].recordset,
        commissionPayments:   results[2].recordset[0],
        revenueTrend:         results[3].recordset,
        outstandingInvoices:  results[4].recordset,
      };
    }

    res.json(response);
  } catch (err) { next(err); }
};

export { getDashboard };
