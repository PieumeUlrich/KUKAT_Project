import { query, sql } from '../config/db.js';

// GET /api/dashboard
// Returns all KPIs needed for the dashboard in one request
const getDashboard = async (req, res, next) => {
  try {
    const isAgent = req.user.role === 'agent';
    const empID   = req.user.employeeID;

    const agentBookingFilter     = isAgent ? `WHERE b.employeeID = ${empID}` : '';
    const agentCommissionFilter  = isAgent ? `WHERE c.employeeID = ${empID}` : '';
    const agentCustomerFilter    = isAgent ? `WHERE assignedAgentID = ${empID}` : '';

    const [
      bookingStats,
      invoiceStats,
      commissionStats,
      customerStats,
      recentBookings,
      recentPayments,
      pendingCommissions,
    ] = await Promise.all([

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
        ${isAgent ? `JOIN bookings b ON b.bookingID = i.bookingID WHERE b.employeeID = ${empID}` : ''}`
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
        ${isAgent ? `WHERE b.employeeID = ${empID}` : ''}
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
        ${isAgent ? `AND c.employeeID = ${empID}` : ''}
        ORDER  BY c.createdAt DESC`
      ),
    ]);

    res.json({
      bookings:           bookingStats.recordset[0],
      invoices:           invoiceStats.recordset[0],
      commissions:        commissionStats.recordset[0],
      customers:          customerStats.recordset[0],
      recentBookings:     recentBookings.recordset,
      recentPayments:     recentPayments.recordset,
      pendingCommissions: pendingCommissions.recordset,
    });
  } catch (err) { next(err); }
};

export { getDashboard };
