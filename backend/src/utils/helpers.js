import {sql} from '../config/db.js';

// Build WHERE clause from a search term across given columns
const buildSearch = (term, columns, params, prefix = '') => {
  if (!term) return '';
  const conditions = columns.map((col, i) => {
    const key = `search${prefix}${i}`;
    params[key] = { type: sql.NVarChar, value: `%${term}%` };
    return `${col} LIKE @${key}`;
  });
  return `(${conditions.join(' OR ')})`;
}

// Standard pagination — returns { offset, limit, page } and adds params
const paginate = (query = {}, params = {}) => {

  const page   = Math.max(1, parseInt(query.page  || 1));
  const limit = query.limit === 'all' ? 10000 : Math.min(10000, Math.max(1, parseInt(query.limit || 25)));
  const offset = (page - 1) * limit;
  params.offset = { type: sql.Int, value: offset };
  params.limit  = { type: sql.Int, value: limit  };
  return { page, limit, offset };
}

// Wrap a recordset and total count into standard response shape
const paginated = (records, total, page, limit) => {
  return {
    data:  records,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

// Throw a clean HTTP error
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
}

export { buildSearch, paginate, paginated, httpError };
