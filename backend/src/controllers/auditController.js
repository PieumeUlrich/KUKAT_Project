import { query, sql } from '../config/db.js';
import { paginate, paginated } from '../utils/helpers.js';

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, tableName, employeeID } = req.query;

    let where = 'WHERE 1=1';
    const params = {};

    if (action) {
      where += ' AND action = @action';
      params.action = { type: sql.NVarChar, value: action };
    }
    if (tableName) {
      where += ' AND tableName = @tableName';
      params.tableName = { type: sql.NVarChar, value: tableName };
    }
    if (employeeID) {
      where += ' AND employeeID = @employeeID';
      params.employeeID = { type: sql.Int, value: parseInt(employeeID) };
    }

    const result = await query(
      `SELECT auditID, employeeID, employeeName, action, tableName,
              recordID, oldValues, newValues, ipAddress, createdAt
       FROM audit_logs ${where}
       ORDER BY createdAt DESC`,
      params
    );

    res.json(result.recordset);
  } catch (err) { next(err); }
};

export { getAuditLogs };