import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';

// GET /api/suppliers/stats
const getStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*)                                                       AS total,
         SUM(CASE WHEN s.isActive = 1 THEN 1 ELSE 0 END)              AS active,
         SUM(CASE WHEN s.isActive = 0 THEN 1 ELSE 0 END)              AS inactive,
         COUNT(DISTINCT CASE WHEN c.status = 'pending'
               THEN c.supplierID END)                                  AS withPendingCommissions,
         COUNT(DISTINCT CASE WHEN c.status NOT IN ('paid','cancelled')
               AND c.dueDate IS NOT NULL
               AND c.dueDate < GETDATE()
               THEN c.supplierID END)                                  AS withOverdueCommissions,
         ISNULL(SUM(CASE WHEN c.status = 'pending'
               THEN c.commissionAmount ELSE 0 END), 0)                 AS totalPendingAmount,
         ISNULL(SUM(CASE WHEN c.status = 'paid'
               THEN c.commissionAmount ELSE 0 END), 0)                 AS totalReceivedAmount
       FROM   suppliers s
       LEFT   JOIN commissions c ON c.supplierID = s.supplierID`
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/suppliers
const getAll = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, categoryID, isActive } = req.query;
    const conditions = [];

    if (categoryID) {
      params.catID = { type: sql.Int, value: parseInt(categoryID) };
      conditions.push('p.categoryID = @catID');
    }
    if (isActive !== undefined && isActive !== '') {
      params.isActive = { type: sql.Bit, value: isActive === 'true' ? 1 : 0 };
      conditions.push('s.isActive = @isActive');
    }

    const searchClause = buildSearch(search, [
      's.supplierName', 's.contactName', 's.representative',
      's.city', 's.country',
      'CAST(s.supplierID AS NVARCHAR)',
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(DISTINCT s.supplierID) AS total
       FROM   suppliers s
       LEFT   JOIN products p ON p.supplierID = s.supplierID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT DISTINCT
         s.supplierID, s.supplierName, s.contactName,
         s.representative, s.email, s.phoneNumber,
         s.city, s.country, s.province,
         s.commissionRate, s.affiliationCode,
         s.isActive, s.createdAt,
         (SELECT COUNT(*) FROM products p2
          WHERE p2.supplierID = s.supplierID)             AS productCount,
         (SELECT ISNULL(SUM(c.commissionAmount), 0)
          FROM commissions c
          WHERE c.supplierID = s.supplierID
          AND   c.status = 'pending')                     AS pendingCommissions,
         (SELECT COUNT(*) FROM commissions c
          WHERE c.supplierID = s.supplierID
          AND   c.status NOT IN ('paid','cancelled')
          AND   c.dueDate IS NOT NULL
          AND   c.dueDate < GETDATE())                    AS overdueCount
       FROM   suppliers s
       LEFT   JOIN products p ON p.supplierID = s.supplierID
       ${where}
       ORDER  BY s.supplierName
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );
    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/suppliers/:id
const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const [supplierResult, productsResult, commissionsResult] = await Promise.all([
      query(
        `SELECT
           s.supplierID, s.supplierName, s.contactName,
           s.representative, s.email, s.phoneNumber,
           s.fax, s.website, s.address1, s.address2,
           s.city, s.province, s.postalCode, s.country,
           s.commissionRate, s.affiliationCode,
           s.isActive, s.notes, s.createdAt, s.updatedAt,
           (SELECT COUNT(*) FROM commissions c
            WHERE c.supplierID = s.supplierID)                           AS totalCommissions,
           (SELECT ISNULL(SUM(c.commissionAmount), 0)
            FROM commissions c
            WHERE c.supplierID = s.supplierID
            AND   c.status = 'paid')                                     AS totalReceived,
           (SELECT ISNULL(SUM(c.commissionAmount), 0)
            FROM commissions c
            WHERE c.supplierID = s.supplierID
            AND   c.status = 'pending')                                  AS totalPending,
           (SELECT COUNT(*) FROM commissions c
            WHERE c.supplierID = s.supplierID
            AND   c.status NOT IN ('paid','cancelled')
            AND   c.dueDate IS NOT NULL
            AND   c.dueDate < GETDATE())                                 AS overdueCount,
           (SELECT COUNT(*) FROM products p
            WHERE p.supplierID = s.supplierID)                           AS productCount,
           (SELECT COUNT(*) FROM bookings b
            JOIN booking_items bi ON bi.bookingID = b.bookingID
            WHERE bi.supplierID = s.supplierID)                          AS totalBookings,
           -- ← CAST fixes computed column comparison issue
           (SELECT ISNULL(SUM(CAST(bi.lineTotal AS DECIMAL(10,2))), 0)
            FROM booking_items bi
            WHERE bi.supplierID = s.supplierID)                          AS totalRevenue
         FROM   suppliers s
         WHERE  s.supplierID = @id`,
        { id: { type: sql.Int, value: id } }
      ),

      // All products for this supplier — one supplier can have many products
      query(
        `SELECT p.productID, p.productName, p.description,
                p.isActive, p.categoryID,
                pc.categoryName,
                COUNT(bi.bookingID)                                          AS bookingCount,
                -- ← CAST fixes computed column comparison issue
                ISNULL(SUM(CAST(bi.lineTotal AS DECIMAL(10,2))), 0)          AS revenue
         FROM   products           p
         JOIN   product_categories pc ON pc.categoryID = p.categoryID
         LEFT   JOIN booking_items bi ON bi.productID  = p.productID
         WHERE  p.supplierID = @id
         GROUP  BY p.productID, p.productName, p.description,
                   p.isActive, p.categoryID, pc.categoryName
         ORDER  BY p.productName`,
        { id: { type: sql.Int, value: id } }
      ),

      // Recent commissions owed by this supplier to the agency
      query(
        `SELECT TOP 10
           c.commissionID, c.commissionAmount, c.commissionRate,
           c.status, c.dueDate, c.createdAt,
           b.bookingID, b.tripEnd,
           i.invoiceID, i.totalAmount AS invoiceTotal,
           e.firstName + ' ' + e.lastName AS agentName,
           CASE WHEN c.status NOT IN ('paid','cancelled')
                 AND c.dueDate IS NOT NULL
                 AND c.dueDate < GETDATE() THEN 1 ELSE 0 END AS isOverdue
         FROM   commissions c
         JOIN   bookings    b ON b.bookingID  = c.bookingID
         JOIN   employees   e ON e.employeeID = b.employeeID
         LEFT   JOIN invoices i ON i.invoiceID = c.invoiceID
         WHERE  c.supplierID = @id
         ORDER  BY c.createdAt DESC`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);

    if (!supplierResult.recordset[0]) throw httpError(404, 'Supplier not found.');

    res.json({
      ...supplierResult.recordset[0],
      products:    productsResult.recordset,
      commissions: commissionsResult.recordset,
    });
  } catch (err) { next(err); }
};

// POST /api/suppliers
const create = async (req, res, next) => {
  try {
    const {
      supplierName, contactName, representative,
      email, phoneNumber, fax, website,
      address1, address2, city, province, postalCode, country,
      commissionRate, affiliationCode, notes, isActive,
    } = req.body;

    if (!supplierName) throw httpError(400, 'supplierName is required.');
    if (commissionRate !== undefined &&
        (parseFloat(commissionRate) < 0 || parseFloat(commissionRate) > 100)) {
      throw httpError(400, 'commissionRate must be between 0 and 100.');
    }

    const existing = await query(
      `SELECT supplierID FROM suppliers WHERE supplierName = @supplierName`,
      { supplierName: { type: sql.NVarChar, value: supplierName } }
    );
    if (existing.recordset[0])
      throw httpError(409, 'A supplier with this name already exists.');

    const result = await query(
      `INSERT INTO suppliers
         (supplierName, contactName, representative, email, phoneNumber,
          fax, website, address1, address2, city, province, postalCode,
          country, commissionRate, affiliationCode, notes, isActive)
       OUTPUT INSERTED.supplierID
       VALUES
         (@supplierName, @contactName, @representative, @email, @phoneNumber,
          @fax, @website, @address1, @address2, @city, @province, @postalCode,
          @country, @commissionRate, @affiliationCode, @notes, @isActive)`,
      {
        supplierName:    { type: sql.NVarChar, value: supplierName },
        contactName:     { type: sql.NVarChar, value: contactName    || null },
        representative:  { type: sql.NVarChar, value: representative || null },
        email:           { type: sql.NVarChar, value: email          || null },
        phoneNumber:     { type: sql.NVarChar, value: phoneNumber    || null },
        fax:             { type: sql.NVarChar, value: fax            || null },
        website:         { type: sql.NVarChar, value: website        || null },
        address1:        { type: sql.NVarChar, value: address1       || null },
        address2:        { type: sql.NVarChar, value: address2       || null },
        city:            { type: sql.NVarChar, value: city           || null },
        province:        { type: sql.NVarChar, value: province       || null },
        postalCode:      { type: sql.NVarChar, value: postalCode     || null },
        country:         { type: sql.NVarChar, value: country        || null },
        commissionRate:  { type: sql.Decimal,  value: parseFloat(commissionRate || 10) },
        affiliationCode: { type: sql.NVarChar, value: affiliationCode || null },
        notes:           { type: sql.NVarChar, value: notes          || null },
        isActive:        { type: sql.Bit,      value: isActive !== false ? 1 : 0 },
      }
    );

    const newID = result.recordset[0].supplierID;
    await auditLog(req, 'CREATE', 'suppliers', newID, null, req.body);
    res.status(201).json({ supplierID: newID, message: 'Supplier created.' });
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:id
const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const {
      supplierName, contactName, representative,
      email, phoneNumber, fax, website,
      address1, address2, city, province, postalCode, country,
      commissionRate, affiliationCode, notes, isActive,
    } = req.body;

    if (!supplierName) throw httpError(400, 'supplierName is required.');
    if (commissionRate !== undefined &&
        (parseFloat(commissionRate) < 0 || parseFloat(commissionRate) > 100)) {
      throw httpError(400, 'commissionRate must be between 0 and 100.');
    }

    const oldResult = await query(
      `SELECT supplierName, contactName, representative, email,
              phoneNumber, city, country, commissionRate, isActive
       FROM suppliers WHERE supplierID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!oldResult.recordset[0]) throw httpError(404, 'Supplier not found.');
    const oldRecord = oldResult.recordset[0];

    await query(
      `UPDATE suppliers SET
         supplierName    = @supplierName,
         contactName     = @contactName,
         representative  = @representative,
         email           = @email,
         phoneNumber     = @phoneNumber,
         fax             = @fax,
         website         = @website,
         address1        = @address1,
         address2        = @address2,
         city            = @city,
         province        = @province,
         postalCode      = @postalCode,
         country         = @country,
         commissionRate  = @commissionRate,
         affiliationCode = @affiliationCode,
         notes           = @notes,
         isActive        = @isActive,
         updatedAt       = GETDATE()
       WHERE supplierID = @id`,
      {
        id:              { type: sql.Int,      value: id },
        supplierName:    { type: sql.NVarChar, value: supplierName },
        contactName:     { type: sql.NVarChar, value: contactName    || null },
        representative:  { type: sql.NVarChar, value: representative || null },
        email:           { type: sql.NVarChar, value: email          || null },
        phoneNumber:     { type: sql.NVarChar, value: phoneNumber    || null },
        fax:             { type: sql.NVarChar, value: fax            || null },
        website:         { type: sql.NVarChar, value: website        || null },
        address1:        { type: sql.NVarChar, value: address1       || null },
        address2:        { type: sql.NVarChar, value: address2       || null },
        city:            { type: sql.NVarChar, value: city           || null },
        province:        { type: sql.NVarChar, value: province       || null },
        postalCode:      { type: sql.NVarChar, value: postalCode     || null },
        country:         { type: sql.NVarChar, value: country        || null },
        commissionRate:  { type: sql.Decimal,  value: parseFloat(commissionRate || 10) },
        affiliationCode: { type: sql.NVarChar, value: affiliationCode || null },
        notes:           { type: sql.NVarChar, value: notes          || null },
        isActive:        { type: sql.Bit,      value: isActive !== false ? 1 : 0 },
      }
    );

    if (parseFloat(oldRecord.commissionRate) !== parseFloat(commissionRate)) {
      await auditLog(req, 'COMMISSION_RATE_CHANGE', 'suppliers', id,
        { commissionRate: oldRecord.commissionRate },
        { commissionRate: parseFloat(commissionRate) }
      );
    }

    await auditLog(req, 'UPDATE', 'suppliers', id, oldRecord, req.body);
    res.json({ message: 'Supplier updated.' });
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:id/deactivate
const deactivate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const activeProducts = await query(
      `SELECT COUNT(*) AS cnt FROM products
       WHERE supplierID = @id AND isActive = 1`,
      { id: { type: sql.Int, value: id } }
    );
    if (activeProducts.recordset[0].cnt > 0) {
      throw httpError(400,
        `Cannot deactivate supplier — they have ${activeProducts.recordset[0].cnt} active product(s). Deactivate products first.`
      );
    }

    await query(
      `UPDATE suppliers SET isActive = 0, updatedAt = GETDATE()
       WHERE supplierID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'DEACTIVATE', 'suppliers', id,
      { isActive: true }, { isActive: false });
    res.json({ message: 'Supplier deactivated.' });
  } catch (err) { next(err); }
};

// PUT /api/suppliers/:id/activate
const activate = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE suppliers SET isActive = 1, updatedAt = GETDATE()
       WHERE supplierID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'ACTIVATE', 'suppliers', id,
      { isActive: false }, { isActive: true });
    res.json({ message: 'Supplier activated.' });
  } catch (err) { next(err); }
};

// GET /api/suppliers/:id/commissions
const getCommissions = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const params = { id: { type: sql.Int, value: id } };
    const { status } = req.query;
    let where = 'WHERE c.supplierID = @id';

    if (status) {
      params.status = { type: sql.NVarChar, value: status };
      where += ' AND c.status = @status';
    }

    const result = await query(
      `SELECT c.commissionID, c.commissionAmount, c.commissionRate,
              c.status, c.dueDate, c.createdAt,
              b.bookingID, b.tripEnd, b.basePrice,
              i.invoiceID, i.totalAmount AS invoiceTotal,
              e.firstName + ' ' + e.lastName AS agentName,
              e.agentCode,
              CASE WHEN c.status NOT IN ('paid','cancelled')
                    AND c.dueDate IS NOT NULL
                    AND c.dueDate < GETDATE() THEN 1 ELSE 0 END AS isOverdue
       FROM   commissions c
       JOIN   bookings    b ON b.bookingID  = c.bookingID
       JOIN   employees   e ON e.employeeID = b.employeeID
       LEFT   JOIN invoices i ON i.invoiceID = c.invoiceID
       ${where}
       ORDER  BY c.createdAt DESC`,
      params
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// GET /api/suppliers/:id/products
// One supplier can have many products — returns all of them
const getProducts = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT p.productID, p.productName, p.description,
              p.isActive, p.categoryID,
              pc.categoryName,
              COUNT(bi.bookingID)                                         AS bookingCount,
              -- ← CAST fixes computed column comparison issue
              ISNULL(SUM(CAST(bi.lineTotal AS DECIMAL(10,2))), 0)         AS revenue
       FROM   products           p
       JOIN   product_categories pc ON pc.categoryID = p.categoryID
       LEFT   JOIN booking_items bi ON bi.productID  = p.productID
       WHERE  p.supplierID = @id
       GROUP  BY p.productID, p.productName, p.description,
                 p.isActive, p.categoryID, pc.categoryName
       ORDER  BY p.productName`,
      { id: { type: sql.Int, value: id } }
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

export {
  getStats, getAll, getById,
  create, update, deactivate, activate,
  getCommissions, getProducts,
};