import { query, sql } from '../config/db.js';

const auditLog = async (req, action, tableName, recordID, oldValues = null, newValues = null, userOverride = null) => {
  try {
    // Use override if provided (for login where req.user isn't set yet)
    const employeeID   = userOverride?.employeeID   ?? req.user?.employeeID   ?? null;
    const employeeName = userOverride?.employeeName ?? (
      req.user
        ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
        : null
    );

    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers?.['user-agent']?.slice(0, 200) || null;

    await query(
      `INSERT INTO audit_logs
         (employeeID, employeeName, action, tableName, recordID, oldValues, newValues, ipAddress, userAgent)
       VALUES
         (@employeeID, @employeeName, @action, @tableName, @recordID, @oldValues, @newValues, @ipAddress, @userAgent)`,
      {
        employeeID:   { type: sql.Int,      value: employeeID },
        employeeName: { type: sql.NVarChar, value: employeeName },
        action:       { type: sql.NVarChar, value: action },
        tableName:    { type: sql.NVarChar, value: tableName },
        recordID:     { type: sql.Int,      value: recordID },
        oldValues:    { type: sql.NVarChar, value: oldValues ? JSON.stringify(oldValues) : null },
        newValues:    { type: sql.NVarChar, value: newValues ? JSON.stringify(newValues) : null },
        ipAddress:    { type: sql.NVarChar, value: ipAddress },
        userAgent:    { type: sql.NVarChar, value: userAgent },
      }
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

export default auditLog;