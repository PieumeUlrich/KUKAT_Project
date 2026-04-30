import api from './client';

// ── Bookings ──────────────────────────────────────────────────
export const bookingsApi = {
  getStats:        ()                       => api.get('/bookings/stats'),
  getAll:          (params = {})            => api.get('/bookings',          { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:         (id)                     => api.get(`/bookings/${id}`),
  create:          (data)                   => api.post('/bookings', data),
  update:          (id, data)               => api.put(`/bookings/${id}`, data),
  confirm:         (id)                     => api.put(`/bookings/${id}/confirm`),
  complete:        (id)                     => api.put(`/bookings/${id}/complete`),
  cancel:          (id)                     => api.put(`/bookings/${id}/cancel`),
  getMembers:      (id)                     => api.get(`/bookings/${id}/members`),
  addMember:       (id, data)               => api.post(`/bookings/${id}/members`, data),
  removeMember:    (bookingID, customerID)  => api.delete(`/bookings/${bookingID}/members/${customerID}`),
  addMemberPayment:(bookingID, customerID, data) => api.post(`/bookings/${bookingID}/members/${customerID}/payment`, data),
  // Reference data used in booking form
  getCustomers:    (params = {})            => api.get('/customers',          { params: { ...params, limit: 'all' } }),
  getCustomerById: (id)                     => api.get(`/customers/${id}`),
  getDestinations: ()                       => api.get('/destinations'),
  getClassTypes:   ()                       => api.get('/class-types'),
  getBookingFees:  ()                       => api.get('/booking-fees'),
  getProducts:     ()                       => api.get('/products'),
};

// ── Customers ─────────────────────────────────────────────────
export const customersApi = {
  getStats:  ()                       => api.get('/customers/stats'),
  getAll:    (params = {})            => api.get('/customers',  { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:   (id)                     => api.get(`/customers/${id}`),
  create:    (data)                   => api.post('/customers', data),
  update:    (id, data)               => api.put(`/customers/${id}`, data),
  getCards:  (id)                     => api.get(`/customers/${id}/cards`),
  reassign:  (id, data)               => api.put(`/customers/${id}/reassign`, data),
};

// ── Invoices ──────────────────────────────────────────────────
export const invoicesApi = {
  getStats:   ()             => api.get('/invoices/stats'),
  getAll:     (params = {})  => api.get('/invoices',  { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:    (id)           => api.get(`/invoices/${id}`),
  addPayment: (id, data)     => api.post(`/invoices/${id}/payments`, data),
  markPaid:   (id)           => api.put(`/invoices/${id}/mark-paid`),
};

// ── Commissions ───────────────────────────────────────────────
export const commissionsApi = {
  getStats:   ()             => api.get('/commissions/stats'),
  getAll:     (params = {})  => api.get('/commissions', { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:    (id)           => api.get(`/commissions/${id}`),
  approve:    (id)           => api.put(`/commissions/${id}/approve`),
  cancel:     (id)           => api.put(`/commissions/${id}/cancel`),
  addPayment: (id, data)     => api.post(`/commissions/${id}/payments`, data),
};

// ── Packages (products) ───────────────────────────────────────
export const packagesApi = {
  getAll:        (params = {}) => api.get('/products',           { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:       (id)          => api.get(`/products/${id}`),
  create:        (data)        => api.post('/products', data),
  update:        (id, data)    => api.put(`/products/${id}`, data),
  getCategories: ()            => api.get('/product-categories'),
  // ← getSuppliers removed — use suppliersApi.getAll() instead
};

// ── Suppliers ─────────────────────────────────────────────────
export const suppliersApi = {
  getStats:       ()            => api.get('/suppliers/stats'),
  getAll:         (params = {}) => api.get('/suppliers',          { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:        (id)          => api.get(`/suppliers/${id}`),
  create:         (data)        => api.post('/suppliers', data),
  update:         (id, data)    => api.put(`/suppliers/${id}`, data),
  deactivate:     (id)          => api.put(`/suppliers/${id}/deactivate`),
  activate:       (id)          => api.put(`/suppliers/${id}/activate`),
  getCommissions: (id, params)  => api.get(`/suppliers/${id}/commissions`, { params }),
  getProducts:    (id)          => api.get(`/suppliers/${id}/products`),
};

// ── Staff (employees) ─────────────────────────────────────────
export const staffApi = {
  getStats:   ()             => api.get('/employees/stats'),
  getAll:     (params = {})  => api.get('/employees',  { params: { ...params, limit: params.limit ?? 'all' } }),
  getById:    (id)           => api.get(`/employees/${id}`),
  create:     (data)         => api.post('/employees', data),
  update:     (id, data)     => api.put(`/employees/${id}`, data),
  deactivate: (id)           => api.put(`/employees/${id}/deactivate`),
  activate:   (id)           => api.put(`/employees/${id}/activate`),
  getRoles:   ()             => api.get('/roles'),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  getRevenueSummary:   (params = {}) => api.get('/reports/revenue',          { params }),
  getBookingStats:     (params = {}) => api.get('/reports/bookings',          { params }),
  getAgentPerformance: (params = {}) => api.get('/reports/agents',            { params }),
  getCommissionReport: (params = {}) => api.get('/reports/commissions',       { params }),
  getTopDestinations:  (params = {}) => api.get('/reports/top-destinations',  { params }),
  getTopProducts:      (params = {}) => api.get('/reports/top-products',      { params }),
  getRevenueTrend:     (params = {}) => api.get('/reports/revenue-trend',     { params }),
  // ← getTopCustomers removed — route doesn't exist in backend
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  // ← now passes params so period filter works
  get: (params = {}) => api.get('/dashboard', { params }),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  get: () => api.get('/notifications'),
};