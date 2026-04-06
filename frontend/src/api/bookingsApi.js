import api from './client';

const bookingsApi = {
  // List — agents only see their own; managers/admin see all
  getAll: (params = {}) =>
    api.get('/bookings', { params }),

  getById: (id) =>
    api.get(`/bookings/${id}`),

  create: (data) =>
    api.post('/bookings', data),

  update: (id, data) =>
    api.put(`/bookings/${id}`, data),

  delete: (id) =>
    api.delete(`/bookings/${id}`),

  // Group members on a booking
  getGroupMembers: (id) =>
    api.get(`/bookings/${id}/members`),

  addGroupMember: (id, data) =>
    api.post(`/bookings/${id}/members`, data),

  removeGroupMember: (bookingId, customerId) =>
    api.delete(`/bookings/${bookingId}/members/${customerId}`),

  updateMemberShare: (bookingId, bookingCustomerId, data) =>
    api.put(`/bookings/${bookingId}/members/${bookingCustomerId}`, data),

  // Reference data for form dropdowns
  getDestinations: () => api.get('/destinations'),
  getClassTypes:   () => api.get('/class-types'),
  getBookingFees:  () => api.get('/booking-fees'),
  getProducts:     () => api.get('/products'),
  getCustomers:    (params = {}) => api.get('/customers', { params }),
};

export default bookingsApi;
