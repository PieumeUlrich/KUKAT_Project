import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';

// ── Products (Packages) ───────────────────────────────────────

const getAllProducts = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, categoryID } = req.query;

    const conditions = [];
    if (categoryID) {
      params.catID = { type: sql.Int, value: parseInt(categoryID) };
      conditions.push('p.categoryID = @catID');
    }
    const searchClause = buildSearch(search, ['p.productName', 's.supplierName'], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM products p
       JOIN suppliers s ON s.supplierID = p.supplierID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT p.productID, p.productName, p.description, p.isActive,
              s.supplierID, s.supplierName, s.commissionRate AS supplierCommissionRate,
              pc.categoryID, pc.categoryName
       FROM   products        p
       JOIN   suppliers       s  ON s.supplierID  = p.supplierID
       JOIN   product_categories pc ON pc.categoryID = p.categoryID
       ${where}
       ORDER  BY p.productName
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );

    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
}

const getProductById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT p.*, s.supplierName, s.commissionRate AS supplierCommissionRate,
              pc.categoryName
       FROM   products p
       JOIN   suppliers s ON s.supplierID = p.supplierID
       JOIN   product_categories pc ON pc.categoryID = p.categoryID
       WHERE  p.productID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!result.recordset[0]) throw httpError(404, 'Product not found.');
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
}

const createProduct = async (req, res, next) => {
  try {
    const { supplierID, categoryID, productName, description, isActive } = req.body;
    if (!supplierID || !categoryID || !productName) {
      throw httpError(400, 'supplierID, categoryID and productName are required.');
    }
    const result = await query(
      `INSERT INTO products (supplierID, categoryID, productName, description, isActive)
       OUTPUT INSERTED.productID
       VALUES (@supplierID, @categoryID, @productName, @description, @isActive)`,
      {
        supplierID:  { type: sql.Int,      value: parseInt(supplierID) },
        categoryID:  { type: sql.Int,      value: parseInt(categoryID) },
        productName: { type: sql.NVarChar, value: productName },
        description: { type: sql.NVarChar, value: description || null },
        isActive:    { type: sql.Bit,      value: isActive !== false ? 1 : 0 },
      }
    );
    res.status(201).json({ productID: result.recordset[0].productID, message: 'Product created.' });
  } catch (err) { next(err); }
}

const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { supplierID, categoryID, productName, description, isActive } = req.body;
    await query(
      `UPDATE products SET
         supplierID = @supplierID, categoryID = @categoryID,
         productName = @productName, description = @description,
         isActive = @isActive, updatedAt = GETDATE()
       WHERE productID = @id`,
      {
        id:          { type: sql.Int,      value: id },
        supplierID:  { type: sql.Int,      value: parseInt(supplierID) },
        categoryID:  { type: sql.Int,      value: parseInt(categoryID) },
        productName: { type: sql.NVarChar, value: productName },
        description: { type: sql.NVarChar, value: description || null },
        isActive:    { type: sql.Bit,      value: isActive !== false ? 1 : 0 },
      }
    );
    res.json({ message: 'Product updated.' });
  } catch (err) { next(err); }
}

// ── Reference data ─────────────────────────────────────────────

const getCategories = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT categoryID, categoryName, rangeStart, rangeEnd
       FROM   product_categories ORDER BY categoryName`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

const getSuppliers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT supplierID, supplierName, contactName, city, country,
              commissionRate, isActive
       FROM   suppliers WHERE isActive = 1 ORDER BY supplierName`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

const getDestinations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT destinationID, destinationCode, destinationName, region
       FROM   destinations ORDER BY destinationName`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

const getClassTypes = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT classID, classCode, description FROM class_types ORDER BY classID`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

const getBookingFees = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT feeID, feeCode, description, feeAmount FROM booking_fees ORDER BY feeID`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
}

export {
  getAllProducts, getProductById, createProduct, updateProduct,
  getCategories, getSuppliers, getDestinations, getClassTypes, getBookingFees,
};
