import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, sql } from '../config/db.js';
import { httpError }  from '../utils/helpers.js';
import auditLog from '../utils/audit.js';
import { sendOTP } from '../utils/mailer.js';

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw httpError(400, 'Email and password are required.');

    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.passwordHash, e.agentCode, e.isActive,
              e.failedPasswordAttempts, e.lastFailedAttempt,
              r.roleName AS role, r.roleID
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.email = @email`,
      { email: { type: sql.NVarChar, value: email } }
    );

    const user = result.recordset[0];
    if (!user)          throw httpError(401, 'Invalid credentials.');
    if (!user.isActive) throw httpError(403, 'Account is deactivated. Contact HR.');

    // Check lockout
    const lockWindow = 15 * 60 * 1000;
    const now        = Date.now();
    const lastFailed = user.lastFailedAttempt
      ? new Date(user.lastFailedAttempt).getTime() : 0;
    const attempts   = user.failedPasswordAttempts || 0;

    if (attempts >= 5 && (now - lastFailed) < lockWindow) {
      throw httpError(429, 'Too many failed attempts. Try again in 15 minutes.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await query(
        `UPDATE employees
        SET failedPasswordAttempts = ISNULL(failedPasswordAttempts, 0) + 1,
        lastFailedAttempt = GETDATE()
        WHERE employeeID = @id`,
        { id: { type: sql.Int, value: user.employeeID } }
      );
      throw httpError(401, 'Invalid credentials.');
    }
    
    // Generate tokens
    const payload      = { employeeID: user.employeeID, role: user.role };
    const token        = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = uuidv4();
    const expiry       = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Store refresh token + reset failed attempts
    await query(
      `UPDATE employees
       SET refreshToken           = @refreshToken,
           refreshTokenExpiry     = @expiry,
           failedPasswordAttempts = 0,
           lastFailedAttempt      = NULL
       WHERE employeeID = @id`,
      {
        refreshToken: { type: sql.NVarChar, value: refreshToken },
        expiry:       { type: sql.DateTime, value: expiry },
        id:           { type: sql.Int,      value: user.employeeID },
      }
    );

    const { passwordHash, roleID, failedPasswordAttempts,
            lastFailedAttempt, ...safeUser } = user;
    await auditLog(req, 'LOGIN', 'employees', user.employeeID, null, { email }, {
      employeeID:   user.employeeID,
      employeeName: `${user.firstName} ${user.lastName}`,
    });
    res.json({ token, refreshToken, user: safeUser });
  } catch (err) { next(err); }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await query(
      `UPDATE employees
       SET refreshToken = NULL, refreshTokenExpiry = NULL
       WHERE employeeID = @id`,
      { id: { type: sql.Int, value: req.user.employeeID } }
    );
    await auditLog(req, 'LOGOUT', 'employees', req.user.employeeID, null, null);
    res.json({ message: 'Logged out.' });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw httpError(400, 'Refresh token is required.');

    const result = await query(
      `SELECT e.employeeID, e.isActive, e.refreshTokenExpiry,
              r.roleName AS role
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.refreshToken = @token`,
      { token: { type: sql.NVarChar, value: refreshToken } }
    );

    const user = result.recordset[0];
    if (!user)          throw httpError(401, 'Invalid refresh token.');
    if (!user.isActive) throw httpError(403, 'Account is deactivated.');
    if (new Date(user.refreshTokenExpiry) < new Date()) {
      throw httpError(401, 'Refresh token expired. Please log in again.');
    }

    const token = jwt.sign(
      { employeeID: user.employeeID, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) { next(err); }
};

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
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw httpError(400, 'Both passwords are required.');
    if (newPassword.length < 8) throw httpError(400, 'New password must be at least 8 characters.');
    if (currentPassword === newPassword) throw httpError(400, 'New password must differ from current.');

    const result = await query(
      `SELECT passwordHash, failedPasswordAttempts, lastFailedAttempt
       FROM employees WHERE employeeID = @id`,
      { id: { type: sql.Int, value: req.user.employeeID } }
    );
    const user = result.recordset[0];

    const lockWindow = 15 * 60 * 1000;
    const now        = Date.now();
    const lastFailed = user.lastFailedAttempt
      ? new Date(user.lastFailedAttempt).getTime() : 0;
    const attempts   = user.failedPasswordAttempts || 0;

    if (attempts >= 5 && (now - lastFailed) < lockWindow) {
      throw httpError(429, 'Too many failed attempts. Try again in 15 minutes.');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      await query(
        `UPDATE employees
         SET failedPasswordAttempts = ISNULL(failedPasswordAttempts, 0) + 1,
             lastFailedAttempt = GETDATE()
         WHERE employeeID = @id`,
        { id: { type: sql.Int, value: req.user.employeeID } }
      );
      throw httpError(401, 'Current password is incorrect.');
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query(
      `UPDATE employees
       SET passwordHash           = @hash,
           failedPasswordAttempts = 0,
           lastFailedAttempt      = NULL,
           updatedAt              = GETDATE()
       WHERE employeeID = @id`,
      {
        hash: { type: sql.NVarChar, value: hash },
        id:   { type: sql.Int,      value: req.user.employeeID },
      }
    );
    await auditLog(req, 'CHANGE_PASSWORD', 'employees', req.user.employeeID, null, null);
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw httpError(400, 'Email is required.');

    // Find employee by email
    const result = await query(
      `SELECT employeeID, firstName, lastName, email
       FROM employees WHERE email = @email AND isActive = 1`,
      { email: { type: sql.NVarChar, value: email } }
    );

    // Always return success — don't reveal if email exists
    if (!result.recordset[0]) {
      return res.json({ message: 'If that email exists, a reset code has been sent.' });
    }

    const employee = result.recordset[0];

    // Invalidate any existing unused OTPs for this email
    await query(
      `UPDATE password_resets SET used = 1
       WHERE email = @email AND used = 0`,
      { email: { type: sql.NVarChar, value: email } }
    );

    // Generate 6-digit OTP
    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP
    await query(
      `INSERT INTO password_resets (email, otp, expiresAt)
       VALUES (@email, @otp, @expiresAt)`,
      {
        email:     { type: sql.NVarChar, value: email },
        otp:       { type: sql.NVarChar, value: otp },
        expiresAt: { type: sql.DateTime, value: expiresAt },
      }
    );

    // Send email
    await sendOTP(email, otp, employee.firstName);

    res.json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (err) { next(err); }
};

// ── POST /api/auth/reset-password ─────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      throw httpError(400, 'Email, OTP and new password are required.');
    if (newPassword.length < 8)
      throw httpError(400, 'Password must be at least 8 characters.');

    // Verify OTP
    const resetResult = await query(
      `SELECT resetID, expiresAt, used
       FROM password_resets
       WHERE email = @email AND otp = @otp
       ORDER BY createdAt DESC`,
      {
        email: { type: sql.NVarChar, value: email },
        otp:   { type: sql.NVarChar, value: otp },
      }
    );

    const reset = resetResult.recordset[0];
    if (!reset) throw httpError(400, 'Invalid reset code.');
    if (reset.used) throw httpError(400, 'This reset code has already been used.');
    if (new Date() > new Date(reset.expiresAt))
      throw httpError(400, 'Reset code has expired. Please request a new one.');

    const hashedPass = await bcrypt.hash(newPassword, 12);

    await query(
      `UPDATE employees SET passwordHash = @passwordHash
       WHERE email = @email`,
      {
        email:        { type: sql.NVarChar, value: email },
        passwordHash: { type: sql.NVarChar, value: hashedPass },
      }
    );

    // Mark OTP as used
    await query(
      `UPDATE password_resets SET used = 1
       WHERE resetID = @resetID`,
      { resetID: { type: sql.Int, value: reset.resetID } }
    );

    // Invalidate refresh token — force re-login
    await query(
      `UPDATE employees SET refreshToken = NULL
       WHERE email = @email`,
      { email: { type: sql.NVarChar, value: email } }
    );

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) { next(err); }
};
export { login, logout, refreshToken, getMe, changePassword, forgotPassword, resetPassword };