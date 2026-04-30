import { Router }    from 'express';
import { query, sql } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  loginValidator, changePasswordValidator, bookingValidator,
  customerValidator, employeeValidator, productValidator,
  paymentValidator, commissionPaymentValidator,
} from '../middleware/validators.js';

import * as auth        from '../controllers/authController.js';
import * as customers   from '../controllers/customersController.js';
import * as bookings    from '../controllers/bookingsController.js';
import * as invoices    from '../controllers/invoicesController.js';
import * as commissions from '../controllers/commissionsController.js';
import * as employees   from '../controllers/employeesController.js';
import * as products    from '../controllers/productsController.js';
import * as reports     from '../controllers/reportsController.js';
import * as dashboard   from '../controllers/dashboardController.js';
import * as automation  from '../controllers/automationController.js';
import * as pdf         from '../controllers/pdfController.js';
import * as audit       from '../controllers/auditController.js';
import * as suppliers   from '../controllers/suppliersController.js';

const router = Router();

const SA  = 'superadmin';
const MGR = 'manager';
const AGT = 'agent';
const ACC = 'accountant';
const HR  = 'hr';

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login',           loginValidator,                              validate, auth.login);
router.put ('/auth/change-password', authenticate, changePasswordValidator,       validate, auth.changePassword);
router.post('/auth/logout',          authenticate,                                          auth.logout);
router.get ('/auth/me',              authenticate,                                          auth.getMe);
router.post('/auth/refresh',                                                                auth.refreshToken);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', authenticate, dashboard.getDashboard);

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', authenticate, automation.getNotifications);

// ── Customers ─────────────────────────────────────────────────
router.get ('/customers/stats',        authenticate, authorize(SA, MGR, AGT, HR),     customers.getStats);
router.get ('/customers',              authenticate, authorize(SA, MGR, AGT, HR),     customers.getAll);
router.post('/customers',              authenticate, authorize(SA, MGR, AGT),         customerValidator, validate, customers.create);
router.put ('/customers/:id',          authenticate, authorize(SA, MGR, AGT),         customerValidator, validate, customers.update);
router.get ('/customers/:id',          authenticate, authorize(SA, MGR, AGT, HR),     customers.getById);
router.put ('/customers/:id/reassign', authenticate, authorize(SA, MGR, HR),          customers.reassign);
router.get ('/customers/:id/cards',    authenticate, authorize(SA, MGR, AGT, HR),     customers.getCards);

// ── Bookings ──────────────────────────────────────────────────
// NOTE: static paths (/stats, /confirm etc.) MUST come before /:id
router.get   ('/bookings/stats',                   authenticate, authorize(SA, MGR, AGT),          bookings.getStats);
router.get   ('/bookings',                         authenticate, authorize(SA, MGR, AGT),          bookings.getAllBookings);
router.post  ('/bookings',                         authenticate, authorize(SA, MGR, AGT),          bookingValidator, validate, bookings.createBooking);
router.put   ('/bookings/:id',                     authenticate, authorize(SA, MGR, AGT),          bookingValidator, validate, bookings.updateBooking);
router.get   ('/bookings/:id',                     authenticate, authorize(SA, MGR, AGT),          bookings.getBookingById);
router.put   ('/bookings/:id/confirm',             authenticate, authorize(SA, MGR, AGT),          automation.confirmBooking);
router.put   ('/bookings/:id/complete',            authenticate, authorize(SA, MGR),               automation.completeBooking);
router.put   ('/bookings/:id/cancel',              authenticate, authorize(SA, MGR),               automation.cancelBooking);
router.get   ('/bookings/:id/members',             authenticate, authorize(SA, MGR, AGT),          bookings.getGroupMembers);
router.post  ('/bookings/:id/members',             authenticate, authorize(SA, MGR, AGT),          bookings.addGroupMember);
router.delete('/bookings/:id/members/:customerID', authenticate, authorize(SA, MGR),               bookings.removeMember);
router.post  ('/bookings/:id/members/:customerID/payment', authenticate, authorize(SA, MGR, AGT, ACC), bookings.addMemberPayment);

// ── Invoices ──────────────────────────────────────────────────
router.get ('/invoices/stats',         authenticate, authorize(SA, MGR, ACC),          invoices.getStats);
router.get ('/invoices',               authenticate, authorize(SA, MGR, ACC),          invoices.getAll);
router.get ('/invoices/:id',           authenticate, authorize(SA, MGR, ACC),          invoices.getById);
router.post('/invoices/:id/payments',  authenticate, authorize(SA, MGR, ACC),          paymentValidator, validate, invoices.addPayment);
router.put ('/invoices/:id/mark-paid', authenticate, authorize(SA, MGR, ACC),          automation.markInvoicePaid);
router.get ('/invoices/:id/pdf',       authenticate, authorize(SA, MGR, ACC, AGT),     pdf.generateInvoicePDF);

// ── Commissions ───────────────────────────────────────────────
// Agents removed — commissions are agency revenue from suppliers
router.get ('/commissions/stats',        authenticate, authorize(SA, MGR, ACC),         commissions.getStats);
router.get ('/commissions',              authenticate, authorize(SA, MGR, ACC),         commissions.getAll);
router.get ('/commissions/:id',          authenticate, authorize(SA, MGR, ACC),         commissions.getById);
router.put ('/commissions/:id/approve',  authenticate, authorize(SA, MGR),              commissions.approve);
router.put ('/commissions/:id/cancel',   authenticate, authorize(SA, MGR),              commissions.cancel);
router.post('/commissions/:id/payments', authenticate, authorize(SA, ACC),              commissionPaymentValidator, validate, commissions.addPayment);

// ── Employees ─────────────────────────────────────────────────
router.get ('/employees/stats',          authenticate, authorize(SA, MGR, HR),          employees.getStats);
router.get ('/roles',                    authenticate,                                  employees.getRoles);
router.get ('/employees',                authenticate, authorize(SA, MGR, HR),          employees.getAll);
router.post('/employees',                authenticate, authorize(SA, HR),               employeeValidator, validate, employees.create);
router.put ('/employees/:id',            authenticate, authorize(SA, HR),               employeeValidator, validate, employees.update);
router.get ('/employees/:id',            authenticate, authorize(SA, MGR, HR),          employees.getById);
router.put ('/employees/:id/deactivate', authenticate, authorize(SA, HR),               employees.deactivate);
router.put ('/employees/:id/activate',   authenticate, authorize(SA, HR),               employees.activate);

// ── Products & reference data ─────────────────────────────────
router.get ('/products',           authenticate,                                         products.getAllProducts);
router.post('/products',           authenticate, authorize(SA, MGR),                     productValidator, validate, products.createProduct);
router.put ('/products/:id',       authenticate, authorize(SA, MGR),                     productValidator, validate, products.updateProduct);
router.get ('/products/:id',       authenticate,                                         products.getProductById);
router.get ('/product-categories', authenticate,                                         products.getCategories);
router.get ('/destinations',       authenticate,                                         products.getDestinations);
router.get ('/class-types',        authenticate,                                         products.getClassTypes);
router.get ('/booking-fees',       authenticate,                                         products.getBookingFees);

// ── Suppliers ─────────────────────────────────────────────────
router.get ('/suppliers/stats',              authenticate, authorize(SA, MGR, ACC),      suppliers.getStats);
router.get ('/suppliers',                    authenticate,                               suppliers.getAll);
router.post('/suppliers',                    authenticate, authorize(SA, MGR),           suppliers.create);
router.put ('/suppliers/:id',                authenticate, authorize(SA, MGR),           suppliers.update);
router.get ('/suppliers/:id',                authenticate,                               suppliers.getById);
router.put ('/suppliers/:id/deactivate',     authenticate, authorize(SA, MGR),           suppliers.deactivate);
router.put ('/suppliers/:id/activate',       authenticate, authorize(SA, MGR),           suppliers.activate);
router.get ('/suppliers/:id/commissions',    authenticate, authorize(SA, MGR, ACC),      suppliers.getCommissions);
router.get ('/suppliers/:id/products',       authenticate,                               suppliers.getProducts);

// ── Reports ───────────────────────────────────────────────────
router.get('/reports/revenue',          authenticate, authorize(SA, MGR, ACC, HR),      reports.getRevenueSummary);
router.get('/reports/bookings',         authenticate, authorize(SA, MGR, ACC, HR),      reports.getBookingStats);
router.get('/reports/agents',           authenticate, authorize(SA, MGR, ACC, HR),      reports.getAgentPerformance);
router.get('/reports/top-destinations', authenticate, authorize(SA, MGR, ACC, HR),      reports.getTopDestinations);
router.get('/reports/top-products',     authenticate, authorize(SA, MGR, ACC, HR),      reports.getTopProducts);
router.get('/reports/commissions',      authenticate, authorize(SA, MGR, ACC),          reports.getCommissionReport);
router.get('/reports/revenue-trend',    authenticate, authorize(SA, MGR, ACC, HR),      reports.getRevenueTrend);

// ── Audit Logs ────────────────────────────────────────────────
router.get('/audit', authenticate, authorize(SA, MGR), audit.getAuditLogs);

// ── HR bulk reassign ──────────────────────────────────────────
router.post('/hr/reassign-clients', authenticate, authorize(SA, HR), async (req, res, next) => {
  try {
    const { customerIDs, agentID } = req.body;
    if (!Array.isArray(customerIDs) || !agentID) {
      return res.status(400).json({ message: 'customerIDs array and agentID required.' });
    }
    for (const id of customerIDs) {
      await query(
        `UPDATE customers SET assignedAgentID = @agentID, updatedAt = GETDATE()
         WHERE customerID = @id`,
        {
          agentID: { type: sql.Int, value: parseInt(agentID) },
          id:      { type: sql.Int, value: parseInt(id) },
        }
      );
    }
    res.json({ message: `${customerIDs.length} customer(s) reassigned.` });
  } catch (err) { next(err); }
});

export default router;