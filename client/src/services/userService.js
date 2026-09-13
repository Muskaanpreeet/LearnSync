import api from './api';

const userService = {
  getUsers: (params) => api.get('/users', { params }).then((res) => res.data),
  getUserById: (id) => api.get(`/users/${id}`).then((res) => res.data),
  setStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }).then((res) => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`).then((res) => res.data),
};

export default userService;
