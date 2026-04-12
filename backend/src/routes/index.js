import { Router }    from 'express';
import { query, sql } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

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

const router = Router();

const SA  = 'superadmin';
const MGR = 'manager';
const AGT = 'agent';
const ACC = 'accountant';
const HR  = 'hr';

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login',           auth.login);
router.post('/auth/logout',          authenticate, auth.logout);
router.get ('/auth/me',              authenticate, auth.getMe);
router.put ('/auth/change-password', authenticate, auth.changePassword);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard', authenticate, dashboard.getDashboard);

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', authenticate, automation.getNotifications);


// ── Customers ─────────────────────────────────────────────────
// IMPORTANT: /stats must be before /:id
router.get ('/customers/stats',        authenticate, authorize(SA, MGR, AGT, HR), customers.getStats);
router.get ('/customers',              authenticate, authorize(SA, MGR, AGT, HR), customers.getAll);
router.post('/customers',              authenticate, authorize(SA, MGR, AGT),     customers.create);
router.get ('/customers/:id',          authenticate, authorize(SA, MGR, AGT, HR), customers.getById);
router.put ('/customers/:id',          authenticate, authorize(SA, MGR, AGT),     customers.update);
router.put ('/customers/:id/reassign', authenticate, authorize(SA, MGR, HR),      customers.reassign);
router.get ('/customers/:id/cards',    authenticate, authorize(SA, MGR, AGT, HR), customers.getCards);

// ── Bookings ──────────────────────────────────────────────────
// IMPORTANT: /stats and sub-paths must be before /:id
router.get   ('/bookings/stats',                   authenticate, authorize(SA, MGR, AGT),     bookings.getStats);
router.get   ('/bookings',                         authenticate, authorize(SA, MGR, AGT),     bookings.getAll);
router.post  ('/bookings',                         authenticate, authorize(SA, MGR, AGT),     bookings.create);
router.put   ('/bookings/:id/confirm',             authenticate, authorize(SA, MGR, AGT),     automation.confirmBooking);
router.put   ('/bookings/:id/complete',            authenticate, authorize(SA, MGR),          automation.completeBooking);
router.put   ('/bookings/:id/cancel',              authenticate, authorize(SA, MGR),          automation.cancelBooking);
router.get   ('/bookings/:id/members',             authenticate, authorize(SA, MGR, AGT),     bookings.getMembers);
router.post  ('/bookings/:id/members',             authenticate, authorize(SA, MGR, AGT),     bookings.addMember);
router.delete('/bookings/:id/members/:customerID', authenticate, authorize(SA, MGR),          bookings.removeMember);
router.get   ('/bookings/:id',                     authenticate, authorize(SA, MGR, AGT),     bookings.getById);
router.put   ('/bookings/:id',                     authenticate, authorize(SA, MGR, AGT),     bookings.update);

// ── Invoices ──────────────────────────────────────────────────
router.get ('/invoices/stats',          authenticate, authorize(SA, MGR, ACC),     invoices.getStats);
router.get ('/invoices',                authenticate, authorize(SA, MGR, ACC),     invoices.getAll);
router.get ('/invoices/:id',            authenticate, authorize(SA, MGR, ACC),     invoices.getById);
router.post('/invoices/:id/payments',   authenticate, authorize(SA, MGR, ACC),     invoices.addPayment);
router.put ('/invoices/:id/mark-paid',  authenticate, authorize(SA, MGR, ACC),     invoices.markPaid);

// ── Commissions ───────────────────────────────────────────────
router.get ('/commissions/stats',            authenticate, authorize(SA, MGR, AGT, ACC), commissions.getStats);
router.get ('/commissions',                  authenticate, authorize(SA, MGR, AGT, ACC), commissions.getAll);
router.get ('/commissions/:id',              authenticate, authorize(SA, MGR, AGT, ACC), commissions.getById);
router.put ('/commissions/:id/approve',      authenticate, authorize(SA, MGR),           commissions.approve);
router.put ('/commissions/:id/cancel',       authenticate, authorize(SA, MGR),           commissions.cancel);
router.post('/commissions/:id/payments',     authenticate, authorize(SA, ACC),           commissions.addPayment);

// ── Employees ─────────────────────────────────────────────────
router.get ('/employees/stats',          authenticate, authorize(SA, MGR, HR),  employees.getStats);
router.get ('/roles',                    authenticate,                           employees.getRoles);
router.get ('/employees',                authenticate, authorize(SA, MGR, HR),  employees.getAll);
router.post('/employees',                authenticate, authorize(SA, HR),       employees.create);
router.get ('/employees/:id',            authenticate, authorize(SA, MGR, HR),  employees.getById);
router.put ('/employees/:id',            authenticate, authorize(SA, HR),       employees.update);
router.put ('/employees/:id/deactivate', authenticate, authorize(SA, HR),       employees.deactivate);
router.put ('/employees/:id/activate',   authenticate, authorize(SA, HR),       employees.activate);

// ── Products & reference data ─────────────────────────────────
router.get ('/products',           authenticate,                    products.getAllProducts);
router.post('/products',           authenticate, authorize(SA, MGR), products.createProduct);
router.get ('/products/:id',       authenticate,                    products.getProductById);
router.put ('/products/:id',       authenticate, authorize(SA, MGR), products.updateProduct);
router.get ('/product-categories', authenticate,                    products.getCategories);
router.get ('/suppliers',          authenticate,                    products.getSuppliers);
router.get ('/destinations',       authenticate,                    products.getDestinations);
router.get ('/class-types',        authenticate,                    products.getClassTypes);
router.get ('/booking-fees',       authenticate,                    products.getBookingFees);

// ── Reports ───────────────────────────────────────────────────
router.get('/reports/revenue',          authenticate, authorize(SA, MGR, ACC, HR), reports.getRevenueSummary);
router.get('/reports/bookings',         authenticate, authorize(SA, MGR, ACC, HR), reports.getBookingStats);
router.get('/reports/agents',           authenticate, authorize(SA, MGR, ACC, HR), reports.getAgentPerformance);
router.get('/reports/top-destinations', authenticate, authorize(SA, MGR, ACC, HR), reports.getTopDestinations);
router.get('/reports/commissions',      authenticate, authorize(SA, MGR, ACC),     reports.getCommissionReport);

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
