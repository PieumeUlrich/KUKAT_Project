import getConnection from "../db/connection.js";

export const getBookingsByDestination = async (req, res) => {
  const { destinationId } = req.query;

  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input("destId", destinationId)
      .query(`
        SELECT
          B.BOOKINGID,
          C.FIRSTNAME + ' ' + C.LASTNAME AS CUSTOMERNAME,
          D.DESTDESCRIPTION,
          CONVERT(varchar(10), B.BOOKINGDATE, 23) AS BOOKINGDATE
        FROM ULRICH.BOOKING B
        JOIN ULRICH.DESTINATION D ON B.DESTINATIONID = D.DESTINATIONID
        JOIN ULRICH.CUSTOMER C ON B.CUSTOMERID = C.CUSTOMERID
        WHERE B.DESTINATIONID = @destId
        ORDER BY B.BOOKINGDATE DESC
      `);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching bookings");
  }
};

export const getDestinations = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT DISTINCT DESTINATIONID, DESTDESCRIPTION
      FROM ULRICH.DESTINATION
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching destinations");
  }
};

