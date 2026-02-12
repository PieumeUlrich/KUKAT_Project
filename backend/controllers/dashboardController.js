// controllers/dashboardController.js
import getConnection from "../db/connection.js";

export const getDashboardMetrics = async (req, res) => {
  try {
    const pool = await getConnection();

    const totalBookings = await pool.request().query(`
      SELECT COUNT(*) AS totalBookings FROM ULRICH.BOOKING
    `);

    const totalRevenue = await pool.request().query(`
      SELECT SUM(BILLEDAMOUNT) AS totalRevenue FROM ULRICH.PAYMENT
    `);

    const currentMonthBookings = await pool.request().query(`
      SELECT COUNT(*) AS currentMonthBookings
      FROM ULRICH.BOOKING
      WHERE MONTH(BOOKINGDATE) = MONTH(GETDATE())
    `);


    const bestProduct = await pool.request().query(`
      SELECT P.PRODUCTNAME
      FROM (SELECT TOP 1 PRODUCTID, COUNT(PRODUCTID) bestProduct FROM ULRICH.BOOKING GROUP BY PRODUCTID ORDER BY 2 DESC) B
      JOIN ULRICH.PRODUCT P ON B.PRODUCTID = P.PRODUCTID    `);

    res.json({
      totalBookings: totalBookings.recordset[0].totalBookings,
      totalRevenue: totalRevenue.recordset[0].totalRevenue,
      currentMonthBookings: currentMonthBookings.recordset[0].currentMonthBookings,
      bestProduct: bestProduct.recordset[0].PRODUCTNAME
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard metrics");
  }
}

export const getLastBookings = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DISTINCT TOP 5 BOOKINGID, CUSTOMERID, D.DESTDESCRIPTION, CONVERT(varchar(10), B.BOOKINGDATE, 23) AS BOOKINGDATE
      FROM ULRICH.BOOKING B JOIN ULRICH.DESTINATION D ON B.DESTINATIONID = D.DESTINATIONID
      ORDER BY BOOKINGDATE DESC
    `);
    res.json(result);
  } catch (err) {
    res.status(500).send("Error loading last bookings");
  }
}

export const getLastTransactions = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DISTINCT TOP 5 PAYMENTID, INVOICEID, BILLEDAMOUNT, CONVERT(varchar(10), PAYMENTDATE, 23) AS PAYMENTDATE
      FROM ULRICH.PAYMENT
      ORDER BY PAYMENTDATE DESC
    `);
    res.json(result);
  } catch (err) {
    res.status(500).send("Error loading last transactions");
  }
}