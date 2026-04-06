// Single canonical API file — all pages import from here
import api from './client';

export const customersApi = {
  getAll:      (params = {}) => api.get('/customers', { params }),
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
  getAll:      (params = {}) => api.get('/invoices', { params }),
  getById:     (id)          => api.get(`/invoices/${id}`),
  create:      (data)        => api.post('/invoices', data),
  update:      (id, data)    => api.put(`/invoices/${id}`, data),
  getPayments: (id)          => api.get(`/invoices/${id}/payments`),
  addPayment:  (id, data)    => api.post(`/invoices/${id}/payments`, data),
  markPaid:    (id)          => api.put(`/invoices/${id}/mark-paid`),
  refund:      (id, data)    => api.post(`/invoices/${id}/refund`, data),
};

export const commissionsApi = {
  getAll:      (params = {}) => api.get('/commissions', { params }),
  getById:     (id)          => api.get(`/commissions/${id}`),
  approve:     (id)          => api.put(`/commissions/${id}/approve`),
  cancel:      (id)          => api.put(`/commissions/${id}/cancel`),
  getPayments: (id)          => api.get(`/commissions/${id}/payments`),
  addPayment:  (id, data)    => api.post(`/commissions/${id}/payments`, data),
  getSummary:  (params = {}) => api.get('/commissions/summary', { params }),
};

export const packagesApi = {
  getAll:        (params = {}) => api.get('/products', { params }),
  getById:       (id)          => api.get(`/products/${id}`),
  create:        (data)        => api.post('/products', data),
  update:        (id, data)    => api.put(`/products/${id}`, data),
  delete:        (id)          => api.delete(`/products/${id}`),
  getCategories: ()            => api.get('/product-categories'),
  getSuppliers:  ()            => api.get('/suppliers'),
};

export const staffApi = {
  getAll:     (params = {}) => api.get('/employees', { params }),
  getById:    (id)          => api.get(`/employees/${id}`),
  create:     (data)        => api.post('/employees', data),
  update:     (id, data)    => api.put(`/employees/${id}`, data),
  deactivate: (id)          => api.put(`/employees/${id}/deactivate`),
  activate:   (id)          => api.put(`/employees/${id}/activate`),
  getRoles:   ()            => api.get('/roles'),
  getStats:   (id)          => api.get(`/employees/${id}/stats`),
};

export const reportsApi = {
  getRevenueSummary:   (params = {}) => api.get('/reports/revenue',           { params }),
  getBookingStats:     (params = {}) => api.get('/reports/bookings',           { params }),
  getAgentPerformance: (params = {}) => api.get('/reports/agents',             { params }),
  getCommissionReport: (params = {}) => api.get('/reports/commissions',        { params }),
  getTopCustomers:     (params = {}) => api.get('/reports/top-customers',      { params }),
  getTopDestinations:  (params = {}) => api.get('/reports/top-destinations',   { params }),
};
