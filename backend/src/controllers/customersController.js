import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';

// GET /api/customers/stats
const getStats = async (req, res, next) => {
  try {
    const params = {};
    const conditions = [];
    if (req.user.role === 'agent') {
      params.empID = { type: sql.Int, value: req.user.employeeID };
      conditions.push('assignedAgentID = @empID');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT
         COUNT(*)                                                              AS total,
         SUM(CASE WHEN bookingCount > 0 THEN 1 ELSE 0 END)                   AS withBookings,
         SUM(CASE WHEN MONTH(createdAt) = MONTH(GETDATE())
                   AND YEAR(createdAt)  = YEAR(GETDATE())  THEN 1 ELSE 0 END) AS newThisMonth
       FROM (
         SELECT c.customerID, c.assignedAgentID, c.createdAt,
                (SELECT COUNT(*) FROM bookings b WHERE b.customerID = c.customerID) AS bookingCount
         FROM customers c
       ) AS sub ${where}`, params
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/customers
const getAll = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, agentID } = req.query;
    const conditions = [];

    const effectiveAgentID = req.user.role === 'agent'
      ? req.user.employeeID : (agentID || null);

    if (effectiveAgentID) {
      params.agentID = { type: sql.Int, value: parseInt(effectiveAgentID) };
      conditions.push('c.assignedAgentID = @agentID');
    }
    const searchClause = buildSearch(search, [
      'c.firstName', 'c.lastName', 'c.email', 'c.city'
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM customers c ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT c.customerID, c.firstName, c.lastName, c.email,
      c.homePhone, c.city, c.province, c.postalCode, c.country,
      c.createdAt, c.assignedAgentID,
      e.firstName + ' ' + e.lastName AS agentName,
      (SELECT COUNT(*) FROM bookings b WHERE b.customerID = c.customerID) AS bookingCount
      FROM   customers c
      LEFT   JOIN employees e ON e.employeeID = c.assignedAgentID
      ${where}
      ORDER  BY c.lastName, c.firstName
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/customers/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'agent') {
      const check = await query(
        `SELECT assignedAgentID FROM customers WHERE customerID = @id`,
        { id: { type: sql.Int, value: id } }
      );
      if (!check.recordset[0] || check.recordset[0].assignedAgentID !== req.user.employeeID) {
        throw httpError(403, 'Access denied.');
      }
    }
    const [custResult, bookingsResult, cardsResult] = await Promise.all([
      query(
        `SELECT c.*, e.firstName AS agentFirstName, e.lastName AS agentLastName,
                e.agentCode, e.email AS agentEmail
         FROM   customers c
         LEFT   JOIN employees e ON e.employeeID = c.assignedAgentID
         WHERE  c.customerID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
      query(
        `SELECT b.bookingID, b.bookingDate, b.tripStart, b.tripEnd,
                b.basePrice, b.status, b.numberOfTravellers,
                p.productName, d.destinationName
         FROM   bookings b
         LEFT   JOIN products     p ON p.productID     = b.productID
         LEFT   JOIN destinations d ON d.destinationID = b.destinationID
         WHERE  b.customerID = @id ORDER BY b.bookingDate DESC`,
        { id: { type: sql.Int, value: id } }
      ),
      query(
        `SELECT cardID, cardNumber, cardHolderName, cardType, expiryDate, isDefault
         FROM   credit_cards WHERE customerID = @id`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);
    if (!custResult.recordset[0]) throw httpError(404, 'Customer not found.');
    res.json({
      ...custResult.recordset[0],
      bookings: bookingsResult.recordset,
      cards:    cardsResult.recordset,
    });
  } catch (err) { next(err); }
};

// POST /api/customers
const create = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, homePhone, businessPhone,
      birthDate, address, city, postalCode, province, country, notes,
    } = req.body;
    if (!firstName || !lastName) throw httpError(400, 'First and last name are required.');

    const agentID = req.user.role === 'agent'
      ? req.user.employeeID : (req.body.assignedAgentID || null);

    const result = await query(
      `INSERT INTO customers
         (assignedAgentID, firstName, lastName, email, homePhone, businessPhone,
          birthDate, address, city, postalCode, province, country, notes)
       OUTPUT INSERTED.customerID
       VALUES
         (@agentID, @firstName, @lastName, @email, @homePhone, @businessPhone,
          @birthDate, @address, @city, @postalCode, @province, @country, @notes)`,
      {
        agentID:       { type: sql.Int,      value: agentID        || null },
        firstName:     { type: sql.NVarChar, value: firstName },
        lastName:      { type: sql.NVarChar, value: lastName },
        email:         { type: sql.NVarChar, value: email          || null },
        homePhone:     { type: sql.NVarChar, value: homePhone      || null },
        businessPhone: { type: sql.NVarChar, value: businessPhone  || null },
        birthDate:     { type: sql.Date,     value: birthDate      || null },
        address:       { type: sql.NVarChar, value: address        || null },
        city:          { type: sql.NVarChar, value: city           || null },
        postalCode:    { type: sql.NVarChar, value: postalCode     || null },
        province:      { type: sql.NVarChar, value: province       || null },
        country:       { type: sql.NVarChar, value: country        || 'Canada' },
        notes:         { type: sql.NVarChar, value: notes          || null },
      }
    );
    const newID = result.recordset[0].customerID;
    await auditLog(req, 'CREATE', 'customers', newID, null, req.body);
    res.status(201).json({ customerID: result.recordset[0].customerID, message: 'Customer created.' });
  } catch (err) { next(err); }
};

// PUT /api/customers/:id
const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      firstName, lastName, email, homePhone, businessPhone,
      birthDate, address, city, postalCode, province, country, notes,
    } = req.body;

    const oldResult = await query(
      `SELECT firstName, lastName, email, homePhone, businessPhone,
              address, city, province, postalCode, country, notes
      FROM customers WHERE customerID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    const oldRecord = oldResult.recordset[0] ?? null;

    await query(
      `UPDATE customers SET
         firstName = @firstName, lastName = @lastName, email = @email,
         homePhone = @homePhone, businessPhone = @businessPhone,
         birthDate = @birthDate, address = @address, city = @city,
         postalCode = @postalCode, province = @province, country = @country,
         notes = @notes, updatedAt = GETDATE()
       WHERE customerID = @id`,
      {
        id:            { type: sql.Int,      value: id },
        firstName:     { type: sql.NVarChar, value: firstName },
        lastName:      { type: sql.NVarChar, value: lastName },
        email:         { type: sql.NVarChar, value: email          || null },
        homePhone:     { type: sql.NVarChar, value: homePhone      || null },
        businessPhone: { type: sql.NVarChar, value: businessPhone  || null },
        birthDate:     { type: sql.Date,     value: birthDate      || null },
        address:       { type: sql.NVarChar, value: address        || null },
        city:          { type: sql.NVarChar, value: city           || null },
        postalCode:    { type: sql.NVarChar, value: postalCode     || null },
        province:      { type: sql.NVarChar, value: province       || null },
        country:       { type: sql.NVarChar, value: country        || 'Canada' },
        notes:         { type: sql.NVarChar, value: notes          || null },
      }
    );
    await auditLog(req, 'UPDATE', 'customers', id, oldRecord, req.body);
    res.json({ message: 'Customer updated.' });
  } catch (err) { next(err); }
};

// PUT /api/customers/:id/reassign
const reassign = async (req, res, next) => {
  try {
    const id      = parseInt(req.params.id);
    const agentID = parseInt(req.body.agentID);
    if (!agentID) throw httpError(400, 'agentID is required.');
    const check = await query(
      `SELECT e.employeeID FROM employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.employeeID = @agentID AND r.roleName = 'agent' AND e.isActive = 1`,
      { agentID: { type: sql.Int, value: agentID } }
    );
    if (!check.recordset[0]) throw httpError(400, 'Target is not an active agent.');
    await query(
      `UPDATE customers SET assignedAgentID = @agentID, updatedAt = GETDATE()
       WHERE  customerID = @id`,
      {
        agentID: { type: sql.Int, value: agentID },
        id:      { type: sql.Int, value: id },
      }
    );
    await auditLog(req, 'REASSIGN', 'customers', id, { agentID: check.recordset[0].employeeID }, { agentID: agentID });
    res.json({ message: 'Customer reassigned.' });
  } catch (err) { next(err); }
};

// GET /api/customers/:id/cards
const getCards = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT cardID, cardNumber, cardHolderName, cardType, expiryDate, isDefault
       FROM   credit_cards WHERE customerID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

export { getStats, getAll, getById, create, update, reassign, getCards };
