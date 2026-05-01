import api from './client';

const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword:  (email, otp, newPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

export default authApi;
