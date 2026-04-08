import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';

// GET /api/bookings/stats
const getStats = async (req, res, next) => {
  try {
    const params = {};
    const conditions = [];
    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('employeeID = @empID');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT
         COUNT(*)                                                 AS total,
         SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled,
         SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END) AS completed,
         ISNULL(SUM(CASE WHEN status != 'cancelled' THEN basePrice ELSE 0 END), 0) AS totalRevenue
       FROM bookings ${where}`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/bookings
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
      conditions.push('b.status = @status');
    }
    const searchClause = buildSearch(search, [
      'c.firstName', 'c.lastName', 'p.productName', 'CAST(b.bookingID AS NVARCHAR)'
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM bookings b
       LEFT JOIN customers c ON c.customerID = b.customerID
       LEFT JOIN products  p ON p.productID  = b.productID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT b.bookingID, b.bookingDate, b.tripStart, b.tripEnd,
              b.basePrice, b.taxRate, b.status, b.numberOfTravellers,
              b.isGroupBooking, b.groupName,
              c.firstName + ' ' + c.lastName AS customerName,
              p.productName,
              d.destinationName AS destination,
              e.firstName + ' ' + e.lastName AS agentName,
              e.agentCode
       FROM   bookings b
       LEFT JOIN customers    c ON c.customerID    = b.customerID
       LEFT JOIN products     p ON p.productID     = b.productID
       LEFT JOIN destinations d ON d.destinationID = b.destinationID
       LEFT JOIN employees    e ON e.employeeID    = b.employeeID
       ${where}
       ORDER BY b.bookingDate DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const [bookingResult, membersResult] = await Promise.all([
      query(
        `SELECT b.*,
                c.firstName AS customerFirstName, c.lastName AS customerLastName,
                c.email AS customerEmail,
                p.productName, d.destinationName,
                ct.description AS classDescription,
                bf.description AS feeName, bf.feeAmount,
                e.firstName AS agentFirstName, e.lastName AS agentLastName,
                e.agentCode, i.invoiceID
         FROM   bookings b
         LEFT JOIN customers    c  ON c.customerID    = b.customerID
         LEFT JOIN products     p  ON p.productID     = b.productID
         LEFT JOIN destinations d  ON d.destinationID = b.destinationID
         LEFT JOIN class_types  ct ON ct.classID      = b.classID
         LEFT JOIN booking_fees bf ON bf.feeID        = b.feeID
         LEFT JOIN employees    e  ON e.employeeID    = b.employeeID
         LEFT JOIN invoices     i  ON i.bookingID     = b.bookingID
         WHERE b.bookingID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
      query(
        `SELECT bc.bookingCustomerID, bc.customerID, bc.role,
                bc.shareAmount, bc.sharePaid, bc.shareStatus, bc.notes,
                c.firstName, c.lastName, c.email
         FROM   booking_customers bc
         JOIN   customers c ON c.customerID = bc.customerID
         WHERE  bc.bookingID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);
    if (!bookingResult.recordset[0]) throw httpError(404, 'Booking not found.');
    if (req.user.role === 'agent' &&
        bookingResult.recordset[0].employeeID !== req.user.employeeID) {
      throw httpError(403, 'Access denied.');
    }
    res.json({ ...bookingResult.recordset[0], members: membersResult.recordset });
  } catch (err) { next(err); }
};

// POST /api/bookings
const create = async (req, res, next) => {
  try {
    const {
      customerID, productID, destinationID, classID, feeID,
      bookingDate, tripStart, tripEnd, numberOfTravellers,
      description, basePrice, taxRate, status, isGroupBooking, groupName, members = [],
    } = req.body;

    if (!customerID)  throw httpError(400, 'customerID is required.');
    if (!productID)   throw httpError(400, 'productID is required.');
    if (!bookingDate) throw httpError(400, 'bookingDate is required.');
    if (!basePrice)   throw httpError(400, 'basePrice is required.');

    const result = await query(
      `INSERT INTO bookings
         (employeeID, customerID, productID, destinationID, classID, feeID,
          bookingDate, tripStart, tripEnd, numberOfTravellers, description,
          basePrice, taxRate, status, isGroupBooking, groupName)
       OUTPUT INSERTED.bookingID
       VALUES
         (@employeeID, @customerID, @productID, @destinationID, @classID, @feeID,
          @bookingDate, @tripStart, @tripEnd, @numberOfTravellers, @description,
          @basePrice, @taxRate, @status, @isGroupBooking, @groupName)`,
      {
        employeeID:         { type: sql.Int,      value: req.user.employeeID },
        customerID:         { type: sql.Int,      value: customerID },
        productID:          { type: sql.Int,      value: productID },
        destinationID:      { type: sql.Int,      value: destinationID  || null },
        classID:            { type: sql.Int,      value: classID        || null },
        feeID:              { type: sql.Int,      value: feeID          || null },
        bookingDate:        { type: sql.Date,     value: bookingDate },
        tripStart:          { type: sql.Date,     value: tripStart      || null },
        tripEnd:            { type: sql.Date,     value: tripEnd        || null },
        numberOfTravellers: { type: sql.Int,      value: numberOfTravellers || 1 },
        description:        { type: sql.NVarChar, value: description    || null },
        basePrice:          { type: sql.Decimal,  value: parseFloat(basePrice) },
        taxRate:            { type: sql.Decimal,  value: parseFloat(taxRate || 5) },
        status:             { type: sql.NVarChar, value: status         || 'pending' },
        isGroupBooking:     { type: sql.Bit,      value: isGroupBooking ? 1 : 0 },
        groupName:          { type: sql.NVarChar, value: groupName      || null },
      }
    );

    const bookingID = result.recordset[0].bookingID;
    await query(
      `INSERT INTO booking_customers (bookingID, customerID, role, shareAmount)
       VALUES (@bookingID, @customerID, 'lead', @basePrice)`,
      {
        bookingID:  { type: sql.Int,     value: bookingID },
        customerID: { type: sql.Int,     value: customerID },
        basePrice:  { type: sql.Decimal, value: parseFloat(basePrice) },
      }
    );
    for (const m of members) {
      await query(
        `INSERT INTO booking_customers (bookingID, customerID, role, shareAmount)
         VALUES (@bookingID, @customerID, 'member', @share)`,
        {
          bookingID:  { type: sql.Int,     value: bookingID },
          customerID: { type: sql.Int,     value: m.customerID },
          share:      { type: sql.Decimal, value: parseFloat(m.shareAmount || 0) },
        }
      );
    }
    res.status(201).json({ bookingID, message: 'Booking created.' });
  } catch (err) { next(err); }
};

// PUT /api/bookings/:id
const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      productID, destinationID, classID, feeID, bookingDate,
      tripStart, tripEnd, numberOfTravellers, description,
      basePrice, taxRate, status, isGroupBooking, groupName,
    } = req.body;
    await query(
      `UPDATE bookings SET
         productID = @productID, destinationID = @destinationID,
         classID = @classID, feeID = @feeID, bookingDate = @bookingDate,
         tripStart = @tripStart, tripEnd = @tripEnd,
         numberOfTravellers = @numberOfTravellers, description = @description,
         basePrice = @basePrice, taxRate = @taxRate, status = @status,
         isGroupBooking = @isGroupBooking, groupName = @groupName, updatedAt = GETDATE()
       WHERE bookingID = @id`,
      {
        id:                 { type: sql.Int,      value: id },
        productID:          { type: sql.Int,      value: productID },
        destinationID:      { type: sql.Int,      value: destinationID  || null },
        classID:            { type: sql.Int,      value: classID        || null },
        feeID:              { type: sql.Int,      value: feeID          || null },
        bookingDate:        { type: sql.Date,     value: bookingDate },
        tripStart:          { type: sql.Date,     value: tripStart      || null },
        tripEnd:            { type: sql.Date,     value: tripEnd        || null },
        numberOfTravellers: { type: sql.Int,      value: numberOfTravellers || 1 },
        description:        { type: sql.NVarChar, value: description    || null },
        basePrice:          { type: sql.Decimal,  value: parseFloat(basePrice) },
        taxRate:            { type: sql.Decimal,  value: parseFloat(taxRate || 5) },
        status:             { type: sql.NVarChar, value: status },
        isGroupBooking:     { type: sql.Bit,      value: isGroupBooking ? 1 : 0 },
        groupName:          { type: sql.NVarChar, value: groupName      || null },
      }
    );
    res.json({ message: 'Booking updated.' });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id/members
const getMembers = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT bc.bookingCustomerID, bc.customerID, bc.role,
              bc.shareAmount, bc.sharePaid, bc.shareStatus, bc.notes,
              c.firstName, c.lastName, c.email
       FROM   booking_customers bc
       JOIN   customers c ON c.customerID = bc.customerID
       WHERE  bc.bookingID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// POST /api/bookings/:id/members
const addMember = async (req, res, next) => {
  try {
    const bookingID = parseInt(req.params.id);
    const { customerID, shareAmount } = req.body;
    if (!customerID) throw httpError(400, 'customerID is required.');
    await query(
      `INSERT INTO booking_customers (bookingID, customerID, role, shareAmount)
       VALUES (@bookingID, @customerID, 'member', @shareAmount)`,
      {
        bookingID:   { type: sql.Int,     value: bookingID },
        customerID:  { type: sql.Int,     value: customerID },
        shareAmount: { type: sql.Decimal, value: parseFloat(shareAmount || 0) },
      }
    );
    res.status(201).json({ message: 'Member added.' });
  } catch (err) { next(err); }
};

// DELETE /api/bookings/:id/members/:customerID
const removeMember = async (req, res, next) => {
  try {
    const bookingID  = parseInt(req.params.id);
    const customerID = parseInt(req.params.customerID);
    await query(
      `DELETE FROM booking_customers
       WHERE bookingID = @bookingID AND customerID = @customerID AND role != 'lead'`,
      {
        bookingID:  { type: sql.Int, value: bookingID },
        customerID: { type: sql.Int, value: customerID },
      }
    );
    res.json({ message: 'Member removed.' });
  } catch (err) { next(err); }
};

export { getStats, getAll, getById, create, update, getMembers, addMember, removeMember };
