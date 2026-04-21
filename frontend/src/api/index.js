// Re-export everything from the canonical file for backward compatibility
import api from './client';

export const bookingsApi = {
  getAll:          (params = {}) => api.get('/bookings', { params: { ...params, limit: 'all' } }),
  getStats:        ()            => api.get('/bookings/stats'),
  getById:         (id)          => api.get(`/bookings/${id}`),
  create:          (data)        => api.post('/bookings', data),
  update:          (id, data)    => api.put(`/bookings/${id}`, data),
  getGroupMembers: (id)          => api.get(`/bookings/${id}/members`),
  addGroupMember:  (id, data)    => api.post(`/bookings/${id}/members`, data),
  removeMember:    (bookingId, customerID) => api.delete(`/bookings/${bookingId}/members/${customerID}`),
  getDestinations: ()            => api.get('/destinations'),
  getClassTypes:   ()            => api.get('/class-types'),
  getBookingFees:  ()            => api.get('/booking-fees'),
  getProducts:     ()            => api.get('/products'),
  getCustomers:    (params = {}) => api.get('/customers', { params: { ...params, limit: 'all' } }),
  confirm:         (id)          => api.put(`/bookings/${id}/confirm`),
  complete:        (id)          => api.put(`/bookings/${id}/complete`),
  cancel:          (id)          => api.put(`/bookings/${id}/cancel`),
  getCustomerById: (id)          => api.get(`/customers/${id}`),
};

export const customersApi = {
  getStats:    ()            => api.get('/customers/stats'),
  getAll:      (params = {}) => api.get('/customers', { params: { ...params, limit: 'all' } }),
  getById:     (id)          => api.get(`/customers/${id}`),
  create:      (data)        => api.post('/customers', data),
  update:      (id, data)    => api.put(`/customers/${id}`, data),
  delete:      (id)          => api.delete(`/customers/${id}`),
  getBookings: (id)          => api.get(`/customers/${id}/bookings`),
  getCards:    (id)          => api.get(`/customers/${id}/cards`),
  addCard:     (id, data)    => api.post(`/customers/${id}/cards`, data),
  deleteCard:  (id, cardId)  => api.delete(`/customers/${id}/cards/${cardId}`),
  reassign:    (id, agentId) => api.put(`/customers/${id}/reassign`, { agentID: agentId }),
  getRewards:  (id)          => api.get(`/customers/${id}/rewards`),
};

export const invoicesApi = {
  getStats:    ()            => api.get('/invoices/stats'),
  getAll:      (params = {}) => api.get('/invoices', { params: { ...params, limit: 'all' } }),
  getById:     (id)          => api.get(`/invoices/${id}`),
  create:      (data)        => api.post('/invoices', data),
  update:      (id, data)    => api.put(`/invoices/${id}`, data),
  getPayments: (id)          => api.get(`/invoices/${id}/payments`),
  addPayment:  (id, data)    => api.post(`/invoices/${id}/payments`, data),
  markPaid:    (id)          => api.put(`/invoices/${id}/mark-paid`),
  refund:      (id, data)    => api.post(`/invoices/${id}/refund`, data),
};

export const commissionsApi = {
  getStats:    ()            => api.get('/commissions/stats'),
  getAll:      (params = {}) => api.get('/commissions', { params: { ...params, limit: 'all' } }),
  getById:     (id)          => api.get(`/commissions/${id}`),
  approve:     (id)          => api.put(`/commissions/${id}/approve`),
  cancel:      (id)          => api.put(`/commissions/${id}/cancel`),
  getPayments: (id)          => api.get(`/commissions/${id}/payments`),
  addPayment:  (id, data)    => api.post(`/commissions/${id}/payments`, data),
  getSummary:  (params = {}) => api.get('/commissions/summary', { params }),
};

export const packagesApi = {
  getAll:        (params = {}) => api.get('/products', { params: { ...params, limit: 'all' } }),
  getById:       (id)          => api.get(`/products/${id}`),
  create:        (data)        => api.post('/products', data),
  update:        (id, data)    => api.put(`/products/${id}`, data),
  delete:        (id)          => api.delete(`/products/${id}`),
  getCategories: ()            => api.get('/product-categories'),
  getSuppliers:  ()            => api.get('/suppliers'),
};

export const staffApi = {
  getStats:    ()            => api.get('/employees/stats'),
  getAll:     (params = {}) => api.get('/employees', { params: { ...params, limit: 'all' } }),
  getById:    (id)          => api.get(`/employees/${id}`),
  create:     (data)        => api.post('/employees', data),
  update:     (id, data)    => api.put(`/employees/${id}`, data),
  deactivate: (id)          => api.put(`/employees/${id}/deactivate`),
  activate:   (id)          => api.put(`/employees/${id}/activate`),
  getRoles:   ()            => api.get('/roles'),
  // getStats:   (id)          => api.get(`/employees/${id}/stats`),
};

export const reportsApi = {
  getRevenueSummary:   (params = {}) => api.get('/reports/revenue',           { params }),
  getBookingStats:     (params = {}) => api.get('/reports/bookings',           { params }),
  getAgentPerformance: (params = {}) => api.get('/reports/agents',             { params }),
  getCommissionReport: (params = {}) => api.get('/reports/commissions',        { params }),
  getTopCustomers:     (params = {}) => api.get('/reports/top-customers',      { params }),
  getTopDestinations:  (params = {}) => api.get('/reports/top-destinations',   { params }),
  getTopProducts:      (params = {}) => api.get('/reports/top-products',        { params }),
  getRevenueTrend:     (params = {}) => api.get('/reports/revenue-trend',       { params }),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const notificationsApi = {
  get: () => api.get('/notifications'),
};

export const bookingActionsApi = {
  confirm:  (id) => api.put(`/bookings/${id}/confirm`),
  complete: (id) => api.put(`/bookings/${id}/complete`),
  cancel:   (id) => api.put(`/bookings/${id}/cancel`),
};