import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { query, sql } from '../config/db.js';
import { httpError }  from '../utils/helpers.js';

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw httpError(400, 'Email and password are required.');

    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.passwordHash, e.agentCode, e.isActive,
              r.roleName AS role, r.roleID
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.email = @email`,
      { email: { type: sql.NVarChar, value: email } }
    );

    const user = result.recordset[0];
    if (!user) throw httpError(401, 'Invalid credentials.');
    if (!user.isActive) throw httpError(403, 'Account is deactivated. Contact HR.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw httpError(401, 'Invalid credentials.');

    const payload = { employeeID: user.employeeID, role: user.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // Strip hash before sending
    const { passwordHash, roleID, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) { next(err); }
}

// POST /api/auth/logout  (client discards token — nothing server-side needed)
const logout = async (req, res) => {
  res.json({ message: 'Logged out.' });
}

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.agentCode, e.phoneNumber, e.city, e.province,
              e.hireDate, e.isActive, r.roleName AS role
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.employeeID = @id`,
      { id: { type: sql.Int, value: req.user.employeeID } }
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
}

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw httpError(400, 'Both passwords are required.');
    if (newPassword.length < 8) throw httpError(400, 'New password must be at least 8 characters.');

    const result = await query(
      `SELECT passwordHash FROM employees WHERE employeeID = @id`,
      { id: { type: sql.Int, value: req.user.employeeID } }
    );
    const user = result.recordset[0];
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw httpError(401, 'Current password is incorrect.');

    const hash = await bcrypt.hash(newPassword, 12);
    await query(
      `UPDATE employees SET passwordHash = @hash, updatedAt = GETDATE()
       WHERE employeeID = @id`,
      {
        hash: { type: sql.NVarChar, value: hash },
        id:   { type: sql.Int,     value: req.user.employeeID },
      }
    );
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
}

export { login, logout, getMe, changePassword };
