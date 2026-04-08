import logger from '../config/logger.js';

function errorHandler(err, req, res, next) {
  logger.error(err.message, {
    stack:  err.stack,
    path:   req.path,
    method: req.method,
    user:   req.user?.employeeID,
  });

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ message: 'Validation failed.', errors: err.errors });
  }

  // SQL errors
  if (err.code === 'EREQUEST' || err.number) {
    return res.status(500).json({ message: 'Database error.' });
  }

  const status  = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Internal server error.')
    : err.message;

  res.status(status).json({ message });
}

export default errorHandler;
