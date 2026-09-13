import api from './api';

// Thin wrapper around /api/auth/* — components/context call these
// functions instead of calling api.post/get directly, so the actual
// endpoint paths only live in one place.
const authService = {
  register: (data) => api.post('/auth/register', data).then((res) => res.data),
  login: (data) => api.post('/auth/login', data).then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
  getMe: () => api.get('/auth/me').then((res) => res.data),
  changePassword: (data) => api.put('/auth/change-password', data).then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (token, password) =>
    api.put(`/auth/reset-password/${token}`, { password }).then((res) => res.data),
};

export default authService;
