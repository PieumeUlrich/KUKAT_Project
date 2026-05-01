import { query, sql } from '../config/db.js';

// GET /api/public/stats — live agency stats for landing page
const getStats = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         (SELECT COUNT(*) FROM bookings
          WHERE status != 'cancelled')                    AS totalBookings,
         (SELECT COUNT(*) FROM customers)                 AS totalCustomers,
         (SELECT COUNT(DISTINCT destinationID)
          FROM booking_items
          WHERE destinationID IS NOT NULL)                AS totalDestinations,
         (SELECT COUNT(*) FROM suppliers
          WHERE isActive = 1)                             AS totalSuppliers,
         (SELECT COUNT(*) FROM employees
          WHERE isActive = 1)                             AS totalAgents,
         (SELECT ISNULL(SUM(basePrice), 0)
          FROM bookings
          WHERE status != 'cancelled')                    AS totalRevenue`
    );
    res.json(result.recordset[0]);
  } catch (err) { next(err); }
};

// GET /api/public/destinations — top destinations for landing page
const getDestinations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TOP 6
         d.destinationID, d.destinationName,
         d.region,
         COUNT(bi.bookingID) AS bookingCount
       FROM   destinations  d
       LEFT   JOIN booking_items bi ON bi.destinationID = d.destinationID
       GROUP  BY d.destinationID, d.destinationName, d.region
       ORDER  BY bookingCount DESC`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// GET /api/public/promotions — active promotions from suppliers
const getPromotions = async (req, res, next) => {
  try {
    // Since we don't have a promotions table yet,
    // return top suppliers with their commission rates as featured partners
    const result = await query(
      `SELECT TOP 6
         s.supplierID, s.supplierName,
         s.commissionRate, s.city, s.country,
         s.affiliationCode,
         (SELECT COUNT(*) FROM products p
          WHERE p.supplierID = s.supplierID
          AND   p.isActive = 1)   AS productCount
       FROM   suppliers s
       WHERE  s.isActive = 1
       ORDER  BY s.commissionRate DESC, s.supplierName`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// GET /api/public/suppliers — active supplier partners
const getSuppliers = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TOP 12
         s.supplierID, s.supplierName,
         s.city, s.country,
         s.affiliationCode,
         (SELECT COUNT(*) FROM products p
          WHERE p.supplierID = s.supplierID
          AND   p.isActive = 1) AS productCount
       FROM   suppliers s
       WHERE  s.isActive = 1
       ORDER  BY s.supplierName`
    );
    res.json(result.recordset);
  } catch (err) { next(err); }
};

// POST /api/public/contact
const contact = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, travelType, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    // Send notification email to agency
    const { sendOTP } = await import('../utils/mailer.js');
    const transporter  = (await import('../utils/mailer.js')).default;

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      process.env.EMAIL_USER,
      subject: `New enquiry from ${firstName} ${lastName}`,
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0B2B40;padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:#F59E0B;margin:0;font-size:1.2rem;">New Travel Enquiry</h2>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#64748B;width:140px;">Name</td>
                  <td style="padding:8px 0;font-weight:600;color:#0B2B40;">${firstName} ${lastName}</td></tr>
              <tr><td style="padding:8px 0;color:#64748B;">Email</td>
                  <td style="padding:8px 0;color:#0B2B40;">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#64748B;">Phone</td>
                  <td style="padding:8px 0;color:#0B2B40;">${phone || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748B;">Travel type</td>
                  <td style="padding:8px 0;color:#0B2B40;text-transform:capitalize;">${travelType || '—'}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#F8FAFC;border-radius:8px;
              border-left:3px solid #F59E0B;">
              <p style="color:#64748B;font-size:0.85rem;margin:0 0 6px;font-weight:600;">
                MESSAGE
              </p>
              <p style="color:#0B2B40;margin:0;line-height:1.6;">${message}</p>
            </div>
            <p style="color:#94A3B8;font-size:0.78rem;margin-top:20px;">
              Received ${new Date().toLocaleString('en-CA')} via KUKAT landing page
            </p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'Enquiry received. We will be in touch soon.' });
  } catch (err) { next(err); }
};

export { getStats, getDestinations, getPromotions, getSuppliers, contact };