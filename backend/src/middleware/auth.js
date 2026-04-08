import jwt     from 'jsonwebtoken';
import { query, sql } from '../config/db.js';

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user + role from DB on every request
    const result = await query(
      `SELECT e.employeeID, e.firstName, e.lastName, e.email,
              e.agentCode, e.isActive, r.roleName AS role
       FROM   employees e
       JOIN   roles r ON r.roleID = e.roleID
       WHERE  e.employeeID = @id`,
      { id: { type: sql.Int, value: decoded.employeeID } }
    );

    const user = result.recordset[0];
    if (!user)        return res.status(401).json({ message: 'User not found.' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

// Role-based authorisation — pass one or more role strings
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    next();
  };
}

export { authenticate, authorize };
