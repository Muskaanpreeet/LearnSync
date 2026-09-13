import api from './api';

const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin').then((res) => res.data),
  getTeacherDashboard: () => api.get('/dashboard/teacher').then((res) => res.data),
  getStudentDashboard: () => api.get('/dashboard/student').then((res) => res.data),
};

export default dashboardService;
