import { query, sql } from '../config/db.js';
import { buildSearch, paginate, paginated, httpError } from '../utils/helpers.js';
import auditLog from '../utils/audit.js';

// ── GET /api/bookings/stats ───────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*)                                                  AS total,
         SUM(CASE WHEN status = 'confirmed'  THEN 1 ELSE 0 END)  AS confirmed,
         SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END)  AS pending,
         SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END)  AS completed,
         SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END)  AS cancelled,
         SUM(CASE WHEN MONTH(createdAt) = MONTH(GETDATE())
               AND YEAR(createdAt) = YEAR(GETDATE())
               THEN 1 ELSE 0 END)                                 AS thisMonth,
         ISNULL(SUM(basePrice), 0)                                AS totalRevenue
       FROM bookings`
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// ── GET /api/bookings ─────────────────────────────────────────
const getAllBookings = async (req, res, next) => {
  try {
    const params = {};
    const { page, limit } = paginate(req.query, params);
    const { search, status, customerID, employeeID } = req.query;
    const conditions = [];

    // Agents only see their own bookings
    const agentID = req.user.role === 'agent'
      ? req.user.employeeID
      : (employeeID ? parseInt(employeeID) : null);

    if (agentID) {
      params.agentID = { type: sql.Int, value: agentID };
      conditions.push('b.employeeID = @agentID');
    }
    if (status) {
      params.status = { type: sql.NVarChar, value: status };
      conditions.push('b.status = @status');
    }
    if (customerID) {
      params.customerID = { type: sql.Int, value: parseInt(customerID) };
      // ← booking_customers.customerID with role = 'lead'
      conditions.push(`EXISTS (
        SELECT 1 FROM booking_customers bc2
        WHERE bc2.bookingID = b.bookingID
        AND bc2.customerID = @customerID
        AND bc2.role = 'lead'
      )`);
    }

    const searchClause = buildSearch(search, [
      'c.firstName', 'c.lastName', 'c.email',
      'CAST(b.bookingID AS NVARCHAR)',
      'e.firstName', 'e.lastName',
    ], params);
    if (searchClause) conditions.push(searchClause);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(DISTINCT b.bookingID) AS total
       FROM   bookings b
       JOIN   booking_customers bc ON bc.bookingID = b.bookingID AND bc.role = 'lead'
       JOIN   customers c ON c.customerID = bc.customerID
       JOIN   employees e ON e.employeeID = b.employeeID
       ${where}`, params
    );
    const total = countResult.recordset[0].total;

    const result = await query(
      `SELECT DISTINCT
         b.bookingID, b.status, b.basePrice, b.bookingDate,
         b.createdAt, b.notes,
         -- Lead customer
         c.firstName AS customerFirstName,
         c.lastName  AS customerLastName,
         c.firstName + ' ' + c.lastName AS customerName,
         -- Agent
         e.firstName + ' ' + e.lastName AS agentName,
         e.agentCode,
         -- Item summary from booking_items
         (SELECT COUNT(*) FROM booking_items bi
          WHERE bi.bookingID = b.bookingID)                        AS itemCount,
         (SELECT STRING_AGG(p.productName, ', ')
          FROM booking_items bi
          JOIN products p ON p.productID = bi.productID
          WHERE bi.bookingID = b.bookingID)                         AS productNames,
         -- Date range from items
         (SELECT MIN(bi.tripStart) FROM booking_items bi
          WHERE bi.bookingID = b.bookingID)                         AS tripStart,
         (SELECT MAX(bi.tripEnd) FROM booking_items bi
          WHERE bi.bookingID = b.bookingID)                         AS tripEnd,
         -- Member count
         (SELECT COUNT(*) FROM booking_customers bc2
          WHERE bc2.bookingID = b.bookingID)                        AS memberCount
       FROM   bookings          b
       JOIN   booking_customers bc ON bc.bookingID = b.bookingID AND bc.role = 'lead'
       JOIN   customers         c  ON c.customerID  = bc.customerID
       JOIN   employees         e  ON e.employeeID  = b.employeeID
       ${where}
       ORDER  BY b.createdAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params
    );

    res.json(paginated(result.recordset, total, page, limit));
  } catch (err) { next(err); }
};

// ── GET /api/bookings/:id ─────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const [bookingResult, itemsResult, membersResult] = await Promise.all([

      query(
        `SELECT
           b.bookingID, b.status, b.basePrice, b.taxRate,
           b.bookingDate, b.notes, b.createdAt,
           -- Agent
           e.employeeID AS agentID,
           e.firstName + ' ' + e.lastName AS agentName,
           e.agentCode,
           -- Invoice
           i.invoiceID, i.status AS invoiceStatus,
           i.totalAmount AS invoiceTotal,
           -- Totals from items
           (SELECT ISNULL(SUM(bi.lineTotal), 0)
            FROM booking_items bi WHERE bi.bookingID = b.bookingID) AS itemsTotal,
           (SELECT COUNT(*) FROM booking_items bi
            WHERE bi.bookingID = b.bookingID)                       AS itemCount,
           (SELECT MIN(bi.tripStart) FROM booking_items bi
            WHERE bi.bookingID = b.bookingID)                       AS tripStart,
           (SELECT MAX(bi.tripEnd) FROM booking_items bi
            WHERE bi.bookingID = b.bookingID)                       AS tripEnd
         FROM   bookings  b
         JOIN   employees e ON e.employeeID = b.employeeID
         LEFT   JOIN invoices i ON i.bookingID = b.bookingID
         WHERE  b.bookingID = @id`,
        { id: { type: sql.Int, value: id } }
      ),

      // All booking items
      query(
        `SELECT
           bi.itemID, bi.productID, bi.supplierID, bi.categoryID,
           bi.description, bi.unitPrice, bi.quantity, bi.lineTotal,
           bi.tripStart, bi.tripEnd, bi.classTypeID, bi.destinationID,
           bi.notes,
           p.productName,
           s.supplierName,
           s.commissionRate AS supplierCommissionRate,
           pc.categoryName,
           ct.description AS className,
           d.destinationName
         FROM   booking_items         bi
         JOIN   products              p  ON p.productID     = bi.productID
         JOIN   suppliers             s  ON s.supplierID    = bi.supplierID
         JOIN   product_categories    pc ON pc.categoryID   = bi.categoryID
         LEFT   JOIN class_types      ct ON ct.classID      = bi.classTypeID
         LEFT   JOIN destinations     d  ON d.destinationID = bi.destinationID
         WHERE  bi.bookingID = @id
         ORDER  BY bi.itemID`,
        { id: { type: sql.Int, value: id } }
      ),

      // All group members
      // ← uses role column, not isLead
      query(
        `SELECT
           bc.customerID, bc.role, bc.shareAmount,
           bc.sharePaid, bc.shareStatus, bc.notes AS memberNotes,
           c.firstName, c.lastName, c.email, c.homePhone
         FROM   booking_customers bc
         JOIN   customers         c ON c.customerID = bc.customerID
         WHERE  bc.bookingID = @id
         ORDER  BY CASE WHEN bc.role = 'lead' THEN 0 ELSE 1 END, c.firstName`,
        { id: { type: sql.Int, value: id } }
      ),
    ]);

    if (!bookingResult.recordset[0]) throw httpError(404, 'Booking not found.');

    res.json({
      ...bookingResult.recordset[0],
      items:   itemsResult.recordset,
      members: membersResult.recordset,
    });
  } catch (err) { next(err); }
};

// ── POST /api/bookings ────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const {
      customerID, employeeID, bookingDate, taxRate,
      notes, items = [], members = [],
    } = req.body;

    if (!customerID) throw httpError(400, 'customerID is required.');
    if (!items.length) throw httpError(400, 'At least one booking item is required.');

    // Calculate basePrice from item line totals
    const basePrice = items.reduce(
      (sum, item) =>
        sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1)), 0
    );

    const agentID = req.user.role === 'agent'
      ? req.user.employeeID
      : (employeeID || req.user.employeeID);

    // Insert booking header
    const bookingResult = await query(
      `INSERT INTO bookings
         (employeeID, customerID, basePrice, taxRate, bookingDate, status, notes)
       OUTPUT INSERTED.bookingID
       VALUES (@employeeID, @customerID, @basePrice, @taxRate, @bookingDate, 'pending', @notes)`,
      {
        employeeID:  { type: sql.Int,      value: agentID },
        customerID:  { type: sql.Int,      value: parseInt(customerID) },
        basePrice:   { type: sql.Decimal,  value: basePrice },
        taxRate:     { type: sql.Decimal,  value: parseFloat(taxRate || 0) },
        bookingDate: { type: sql.Date,     value: bookingDate || new Date() },
        notes:       { type: sql.NVarChar, value: notes || null },
      }
    );

    const bookingID = bookingResult.recordset[0].bookingID;

    // Insert all booking items
    for (const item of items) {
      const productResult = await query(
        `SELECT p.supplierID, p.categoryID
         FROM products p WHERE p.productID = @productID`,
        { productID: { type: sql.Int, value: parseInt(item.productID) } }
      );
      const product = productResult.recordset[0];
      if (!product) throw httpError(400, `Product ${item.productID} not found.`);

      await query(
        `INSERT INTO booking_items
           (bookingID, productID, supplierID, categoryID,
            description, unitPrice, quantity,
            tripStart, tripEnd, classTypeID, destinationID, notes)
         VALUES
           (@bookingID, @productID, @supplierID, @categoryID,
            @description, @unitPrice, @quantity,
            @tripStart, @tripEnd, @classTypeID, @destinationID, @notes)`,
        {
          bookingID:     { type: sql.Int,      value: bookingID },
          productID:     { type: sql.Int,      value: parseInt(item.productID) },
          supplierID:    { type: sql.Int,      value: product.supplierID },
          categoryID:    { type: sql.Int,      value: product.categoryID },
          description:   { type: sql.NVarChar, value: item.description   || null },
          unitPrice:     { type: sql.Decimal,  value: parseFloat(item.unitPrice || 0) },
          quantity:      { type: sql.Int,      value: parseInt(item.quantity || 1) },
          tripStart:     { type: sql.Date,     value: item.tripStart      || null },
          tripEnd:       { type: sql.Date,     value: item.tripEnd        || null },
          classTypeID:   { type: sql.Int,      value: item.classTypeID    || null },
          destinationID: { type: sql.Int,      value: item.destinationID  || null },
          notes:         { type: sql.NVarChar, value: item.notes          || null },
        }
      );
    }

    // Insert lead customer — role = 'lead'
    await query(
      `INSERT INTO booking_customers
         (bookingID, customerID, role, shareAmount, shareStatus)
       VALUES (@bookingID, @customerID, 'lead', @basePrice, 'unpaid')`,
      {
        bookingID:  { type: sql.Int,     value: bookingID },
        customerID: { type: sql.Int,     value: parseInt(customerID) },
        basePrice:  { type: sql.Decimal, value: basePrice },
      }
    );

    // Insert additional group members — role = 'member'
    for (const m of members) {
      await query(
        `INSERT INTO booking_customers
           (bookingID, customerID, role, shareAmount, shareStatus)
         VALUES (@bookingID, @customerID, 'member', @share, 'unpaid')`,
        {
          bookingID:  { type: sql.Int,     value: bookingID },
          customerID: { type: sql.Int,     value: parseInt(m.customerID) },
          share:      { type: sql.Decimal, value: parseFloat(m.shareAmount || 0) },
        }
      );
    }

    await auditLog(req, 'CREATE', 'bookings', bookingID, null, {
      customerID, items: items.length, basePrice,
    });

    res.status(201).json({ bookingID, message: 'Booking created.' });
  } catch (err) { next(err); }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────
const updateBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { bookingDate, taxRate, notes, status, items = [] } = req.body;

    const oldResult = await query(
      `SELECT bookingID, status, basePrice FROM bookings WHERE bookingID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    if (!oldResult.recordset[0]) throw httpError(404, 'Booking not found.');
    const old = oldResult.recordset[0];

    const basePrice = items.length
      ? items.reduce(
          (sum, item) =>
            sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1)), 0
        )
      : old.basePrice;

    await query(
      `UPDATE bookings SET
         basePrice   = @basePrice,
         taxRate     = @taxRate,
         bookingDate = @bookingDate,
         status      = @status,
         notes       = @notes,
         updatedAt   = GETDATE()
       WHERE bookingID = @id`,
      {
        id:          { type: sql.Int,      value: id },
        basePrice:   { type: sql.Decimal,  value: basePrice },
        taxRate:     { type: sql.Decimal,  value: parseFloat(taxRate || 0) },
        bookingDate: { type: sql.Date,     value: bookingDate },
        status:      { type: sql.NVarChar, value: status },
        notes:       { type: sql.NVarChar, value: notes || null },
      }
    );

    // Replace items if new items provided
    if (items.length) {
      await query(
        `DELETE FROM booking_items WHERE bookingID = @id`,
        { id: { type: sql.Int, value: id } }
      );

      for (const item of items) {
        const productResult = await query(
          `SELECT supplierID, categoryID FROM products WHERE productID = @productID`,
          { productID: { type: sql.Int, value: parseInt(item.productID) } }
        );
        const product = productResult.recordset[0];
        if (!product) throw httpError(400, `Product ${item.productID} not found.`);

        await query(
          `INSERT INTO booking_items
             (bookingID, productID, supplierID, categoryID,
              description, unitPrice, quantity,
              tripStart, tripEnd, classTypeID, destinationID, notes)
           VALUES
             (@bookingID, @productID, @supplierID, @categoryID,
              @description, @unitPrice, @quantity,
              @tripStart, @tripEnd, @classTypeID, @destinationID, @notes)`,
          {
            bookingID:     { type: sql.Int,      value: id },
            productID:     { type: sql.Int,      value: parseInt(item.productID) },
            supplierID:    { type: sql.Int,      value: product.supplierID },
            categoryID:    { type: sql.Int,      value: product.categoryID },
            description:   { type: sql.NVarChar, value: item.description   || null },
            unitPrice:     { type: sql.Decimal,  value: parseFloat(item.unitPrice || 0) },
            quantity:      { type: sql.Int,      value: parseInt(item.quantity || 1) },
            tripStart:     { type: sql.Date,     value: item.tripStart      || null },
            tripEnd:       { type: sql.Date,     value: item.tripEnd        || null },
            classTypeID:   { type: sql.Int,      value: item.classTypeID    || null },
            destinationID: { type: sql.Int,      value: item.destinationID  || null },
            notes:         { type: sql.NVarChar, value: item.notes          || null },
          }
        );
      }

      // Update lead member share to match new basePrice
      await query(
        `UPDATE booking_customers
         SET shareAmount = @basePrice
         WHERE bookingID = @id AND role = 'lead'`,
        {
          id:        { type: sql.Int,     value: id },
          basePrice: { type: sql.Decimal, value: basePrice },
        }
      );
    }

    // ── Update members if provided ────────────────────────────
    if (req.body.members !== undefined) {
      const currentMembers = await query(
        `SELECT customerID, role FROM booking_customers WHERE bookingID = @id`,
        { id: { type: sql.Int, value: id } }
      );
      const leadCustomer = currentMembers.recordset.find(m => m.role === 'lead');

      await query(
        `DELETE FROM booking_customers 
        WHERE bookingID = @id AND role != 'lead'`,
        { id: { type: sql.Int, value: id } }
      );

      for (const m of req.body.members) {
        if (leadCustomer && m.customerID === leadCustomer.customerID) continue;

        const exists = await query(
          `SELECT customerID FROM booking_customers
          WHERE bookingID = @bookingID AND customerID = @customerID`,
          {
            bookingID:  { type: sql.Int, value: id },
            customerID: { type: sql.Int, value: parseInt(m.customerID) },
          }
        );
        if (exists.recordset[0]) continue;

        await query(
          `INSERT INTO booking_customers
            (bookingID, customerID, role, shareAmount, shareStatus)
          VALUES (@bookingID, @customerID, 'member', @shareAmount, 'unpaid')`,
          {
            bookingID:   { type: sql.Int,     value: id },
            customerID:  { type: sql.Int,     value: parseInt(m.customerID) },
            shareAmount: { type: sql.Decimal, value: parseFloat(m.shareAmount || 0) },
          }
        );
      }
    }

    await auditLog(req, 'UPDATE', 'bookings', id, old, req.body);
    res.json({ message: 'Booking updated.' });
  } catch (err) { next(err); }
};

// ── PUT /api/bookings/:id/confirm ─────────────────────────────
const confirmBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE bookings SET status = 'confirmed', updatedAt = GETDATE()
       WHERE bookingID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'CONFIRM', 'bookings', id,
      { status: 'pending' }, { status: 'confirmed' });
    res.json({ message: 'Booking confirmed.' });
  } catch (err) { next(err); }
};

// ── PUT /api/bookings/:id/complete ────────────────────────────
const completeBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE bookings SET status = 'completed', updatedAt = GETDATE()
       WHERE bookingID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'COMPLETE', 'bookings', id,
      { status: 'confirmed' }, { status: 'completed' });
    res.json({ message: 'Booking completed.' });
  } catch (err) { next(err); }
};

// ── PUT /api/bookings/:id/cancel ──────────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await query(
      `UPDATE bookings SET status = 'cancelled', updatedAt = GETDATE()
       WHERE bookingID = @id`,
      { id: { type: sql.Int, value: id } }
    );
    await auditLog(req, 'CANCEL', 'bookings', id,
      { status: 'confirmed' }, { status: 'cancelled' });
    res.json({ message: 'Booking cancelled.' });
  } catch (err) { next(err); }
};

// ── GET /api/bookings/:id/members ─────────────────────────────
const getGroupMembers = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      `SELECT
         bc.customerID, bc.role, bc.shareAmount,
         bc.sharePaid, bc.shareStatus, bc.notes AS memberNotes,
         c.firstName, c.lastName, c.email, c.homePhone
       FROM   booking_customers bc
       JOIN   customers         c ON c.customerID = bc.customerID
       WHERE  bc.bookingID = @id
       ORDER  BY CASE WHEN bc.role = 'lead' THEN 0 ELSE 1 END, c.firstName`,
      { id: { type: sql.Int, value: id } }
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// ── POST /api/bookings/:id/members ────────────────────────────
const addGroupMember = async (req, res, next) => {
  try {
    const bookingID  = parseInt(req.params.id);
    const { customerID, shareAmount } = req.body;

    if (!customerID) throw httpError(400, 'customerID is required.');

    const existing = await query(
      `SELECT customerID FROM booking_customers
       WHERE bookingID = @bookingID AND customerID = @customerID`,
      {
        bookingID:  { type: sql.Int, value: bookingID },
        customerID: { type: sql.Int, value: parseInt(customerID) },
      }
    );
    if (existing.recordset[0])
      throw httpError(409, 'Customer is already a member of this booking.');

    await query(
      `INSERT INTO booking_customers
         (bookingID, customerID, role, shareAmount, shareStatus)
       VALUES (@bookingID, @customerID, 'member', @shareAmount, 'unpaid')`,
      {
        bookingID:   { type: sql.Int,     value: bookingID },
        customerID:  { type: sql.Int,     value: parseInt(customerID) },
        shareAmount: { type: sql.Decimal, value: parseFloat(shareAmount || 0) },
      }
    );

    await auditLog(req, 'UPDATE', 'booking_customers', bookingID,
      null, { customerID, shareAmount });
    res.status(201).json({ message: 'Member added.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/bookings/:id/members/:customerID ──────────────
const removeMember = async (req, res, next) => {
  try {
    const bookingID  = parseInt(req.params.id);
    const customerID = parseInt(req.params.customerID);

    const check = await query(
      `SELECT role FROM booking_customers
       WHERE bookingID = @bookingID AND customerID = @customerID`,
      {
        bookingID:  { type: sql.Int, value: bookingID },
        customerID: { type: sql.Int, value: customerID },
      }
    );
    if (!check.recordset[0]) throw httpError(404, 'Member not found.');
    // ← uses role column
    if (check.recordset[0].role === 'lead')
      throw httpError(400, 'Cannot remove the lead customer.');

    await query(
      `DELETE FROM booking_customers
       WHERE bookingID = @bookingID AND customerID = @customerID`,
      {
        bookingID:  { type: sql.Int, value: bookingID },
        customerID: { type: sql.Int, value: customerID },
      }
    );

    await auditLog(req, 'UPDATE', 'booking_customers', bookingID,
      { customerID }, null);
    res.json({ message: 'Member removed.' });
  } catch (err) { next(err); }
};

// ── POST /api/bookings/:id/members/:customerID/payment ────────
const addMemberPayment = async (req, res, next) => {
  try {
    const bookingID  = parseInt(req.params.id);
    const customerID = parseInt(req.params.customerID);
    const { amountPaid, paymentMethod, paymentDate, reference, notes } = req.body;

    if (!amountPaid) throw httpError(400, 'amountPaid is required.');

    const invoiceResult = await query(
      `SELECT invoiceID, totalAmount FROM invoices WHERE bookingID = @bookingID`,
      { bookingID: { type: sql.Int, value: bookingID } }
    );
    if (!invoiceResult.recordset[0])
      throw httpError(404, 'Invoice not found for this booking.');
    const { invoiceID, totalAmount } = invoiceResult.recordset[0];

    // Record payment
    await query(
      `INSERT INTO payments
         (invoiceID, amountPaid, paymentMethod, paymentType,
          paymentDate, reference, notes, status)
       VALUES
         (@invoiceID, @amountPaid, @paymentMethod, 'partial',
          @paymentDate, @reference, @notes, 'completed')`,
      {
        invoiceID:     { type: sql.Int,      value: invoiceID },
        amountPaid:    { type: sql.Decimal,  value: parseFloat(amountPaid) },
        paymentMethod: { type: sql.NVarChar, value: paymentMethod || 'CASH' },
        paymentDate:   { type: sql.Date,     value: paymentDate || new Date() },
        reference:     { type: sql.NVarChar, value: reference || null },
        notes:         { type: sql.NVarChar, value: notes || null },
      }
    );

    // Update member share
    await query(
      `UPDATE booking_customers
       SET sharePaid   = ISNULL(sharePaid, 0) + @amountPaid,
           shareStatus = CASE
             WHEN ISNULL(sharePaid, 0) + @amountPaid >= shareAmount THEN 'paid'
             WHEN ISNULL(sharePaid, 0) + @amountPaid > 0            THEN 'partial'
             ELSE 'unpaid' END
       WHERE bookingID = @bookingID AND customerID = @customerID`,
      {
        bookingID:  { type: sql.Int,     value: bookingID },
        customerID: { type: sql.Int,     value: customerID },
        amountPaid: { type: sql.Decimal, value: parseFloat(amountPaid) },
      }
    );

    // Recalculate invoice status
    const paidResult = await query(
      `SELECT ISNULL(SUM(amountPaid), 0) AS totalPaid
       FROM payments WHERE invoiceID = @invoiceID AND status = 'completed'`,
      { invoiceID: { type: sql.Int, value: invoiceID } }
    );
    const totalPaid     = parseFloat(paidResult.recordset[0].totalPaid);
    const invoiceStatus = totalPaid >= parseFloat(totalAmount)
      ? 'paid'
      : totalPaid > 0 ? 'partial' : 'unpaid';

    await query(
      `UPDATE invoices SET status = @status WHERE invoiceID = @invoiceID`,
      {
        invoiceID: { type: sql.Int,      value: invoiceID },
        status:    { type: sql.NVarChar, value: invoiceStatus },
      }
    );

    await auditLog(req, 'MEMBER_PAYMENT', 'bookings', bookingID,
      null, { customerID, amountPaid });
    res.json({ message: 'Member payment recorded.' });
  } catch (err) { next(err); }
};

export {
  getStats,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  confirmBooking,
  completeBooking,
  cancelBooking,
  getGroupMembers,
  addGroupMember,
  removeMember,
  addMemberPayment,
};