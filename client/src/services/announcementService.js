import api from './api';

const announcementService = {
  getAnnouncements: (params) => api.get('/announcements', { params }).then((res) => res.data),
  createAnnouncement: (data) => api.post('/announcements', data).then((res) => res.data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data).then((res) => res.data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`).then((res) => res.data),
};

export default announcementService;
