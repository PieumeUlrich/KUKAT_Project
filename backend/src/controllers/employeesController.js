import bcrypt from 'bcryptjs';
import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';

// GET /api/employees/stats
const getStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*)                                                    AS total,
         SUM(CASE WHEN e.isActive = 1 THEN 1 ELSE 0 END)           AS active,
         SUM(CASE WHEN e.isActive = 0 THEN 1 ELSE 0 END)           AS inactive,
         SUM(CASE WHEN r.roleName = 'agent' THEN 1 ELSE 0 END)     AS agents,
         SUM(CASE WHEN r.roleName = 'manager' THEN 1 ELSE 0 END)   AS managers,
         SUM(CASE WHEN r.roleName = 'accountant' THEN 1 ELSE 0 END) AS accountants,
         SUM(CASE WHEN r.roleName = 'hr' THEN 1 ELSE 0 END)        AS hr,
         SUM(CASE WHEN MONTH(e.hireDate) = MONTH(GETDATE())
                   AND YEAR(e.hireDate)  = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS newThisMonth
       FROM employees e
       JOIN roles r ON r.roleID = e.roleID`
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/employees
const getAll = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, role } = req.query;
    const conditions = [];

    if (role) {
      params.role = { type: sql.NVarChar, value: role };
      conditions.push('r.roleName = @role');
    }
    const searchClause = buildSearch(search, [
      'e.firstName', 'e.lastName', 'e.email', 'e.agentCode'
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM employees e
       JOIN roles r ON r.roleID = e.roleID ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.agentCode, e.phoneNumber, e.city, e.province,
              e.postalCode, e.isActive, e.hireDate, e.createdAt,
              r.roleName, r.roleID, e.address1
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       ${where}
       ORDER  BY e.lastName, e.firstName
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/employees/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.agentCode, e.phoneNumber, e.address1, e.city,
              e.province, e.postalCode, e.country, e.isActive,
              e.hireDate, e.createdAt, r.roleName, r.roleID,
              (SELECT COUNT(*) FROM bookings    b WHERE b.employeeID = e.employeeID) AS bookingCount,
              (SELECT COUNT(*) FROM commissions c WHERE c.employeeID = e.employeeID) AS commissionCount,
              (SELECT ISNULL(SUM(cp.paymentAmount), 0)
               FROM commission_payments cp WHERE cp.employeeID = e.employeeID)       AS totalPaid
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.employeeID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!result.recordset[0]) throw httpError(404, 'Employee not found.');
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// POST /api/employees
const create = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, password, roleID, agentCode,
      phoneNumber, address1, city, province, postalCode, country, hireDate,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !roleID) {
      throw httpError(400, 'firstName, lastName, email, password and roleID are required.');
    }
    if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters.');

    const existing = await query(
      `SELECT employeeID FROM employees WHERE email = @email`,
      { email: { type: sql.NVarChar, value: email } }
    );
    if (existing.recordset[0]) throw httpError(409, 'Email already in use.');

    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO employees
         (roleID, firstName, lastName, email, passwordHash, agentCode,
          phoneNumber, address1, city, province, postalCode, country, hireDate, isActive)
       OUTPUT INSERTED.employeeID
       VALUES
         (@roleID, @firstName, @lastName, @email, @hash, @agentCode,
          @phoneNumber, @address1, @city, @province, @postalCode, @country, @hireDate, 1)`,
      {
        roleID:      { type: sql.Int,      value: parseInt(roleID) },
        firstName:   { type: sql.NVarChar, value: firstName },
        lastName:    { type: sql.NVarChar, value: lastName },
        email:       { type: sql.NVarChar, value: email },
        hash:        { type: sql.NVarChar, value: hash },
        agentCode:   { type: sql.NVarChar, value: agentCode   || null },
        phoneNumber: { type: sql.NVarChar, value: phoneNumber  || null },
        address1:    { type: sql.NVarChar, value: address1     || null },
        city:        { type: sql.NVarChar, value: city         || null },
        province:    { type: sql.NVarChar, value: province     || null },
        postalCode:  { type: sql.NVarChar, value: postalCode   || null },
        country:     { type: sql.NVarChar, value: country      || 'Canada' },
        hireDate:    { type: sql.Date,     value: hireDate     || null },
      }
    );
    const newID = result.recordset[0].employeeID;
    await auditLog(req, 'CREATE', 'employees', newID, null, { ...req.body, password: '[REDACTED]' });
    res.status(201).json({ employeeID: newID, message: 'Employee created.' });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id
const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      firstName, lastName, email, roleID, agentCode,
      phoneNumber, address1, city, province, postalCode, country,
      hireDate, isActive,
    } = req.body;
    await query(
      `UPDATE employees SET
         firstName   = @firstName,  lastName    = @lastName,
         email       = @email,      roleID      = @roleID,
         agentCode   = @agentCode,  phoneNumber = @phoneNumber,
         address1    = @address1,   city        = @city,
         province    = @province,   postalCode  = @postalCode,
         country     = @country,    hireDate    = @hireDate,
         isActive    = @isActive,   updatedAt   = GETDATE()
       WHERE employeeID = @id`,
      {
        id:          { type: sql.Int,      value: id },
        firstName:   { type: sql.NVarChar, value: firstName },
        lastName:    { type: sql.NVarChar, value: lastName },
        email:       { type: sql.NVarChar, value: email },
        roleID:      { type: sql.Int,      value: parseInt(roleID) },
        agentCode:   { type: sql.NVarChar, value: agentCode   || null },
        phoneNumber: { type: sql.NVarChar, value: phoneNumber  || null },
        address1:    { type: sql.NVarChar, value: address1     || null },
        city:        { type: sql.NVarChar, value: city         || null },
        province:    { type: sql.NVarChar, value: province     || null },
        postalCode:  { type: sql.NVarChar, value: postalCode   || null },
        country:     { type: sql.NVarChar, value: country      || 'Canada' },
        hireDate:    { type: sql.Date,     value: hireDate     || null },
        isActive:    { type: sql.Bit,      value: isActive ? 1 : 0 },
      }
    );
    res.json({ message: 'Employee updated.' });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id/deactivate
const deactivate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.employeeID) throw httpError(400, 'Cannot deactivate your own account.');
    await query(
      `UPDATE employees SET isActive = 0, updatedAt = GETDATE() WHERE employeeID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'DEACTIVATE', 'employees', id, null, false );
    res.json({ message: 'Employee deactivated.' });
  } catch (err) { next(err); }
};

// PUT /api/employees/:id/activate
const activate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE employees SET isActive = 1, updatedAt = GETDATE() WHERE employeeID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'ACTIVATE', 'employees', id, null, true );
    res.json({ message: 'Employee activated.' });
  } catch (err) { next(err); }
};

// GET /api/roles
const getRoles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT roleID, roleName, description FROM roles ORDER BY roleID`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

export { getStats, getAll, getById, create, update, deactivate, activate, getRoles };
