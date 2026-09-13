import api from './api';

const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }).then((res) => res.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((res) => res.data),
  markAllAsRead: () => api.put('/notifications/read-all').then((res) => res.data),
};

export default notificationService;
