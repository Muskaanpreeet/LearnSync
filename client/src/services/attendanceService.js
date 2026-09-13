import api from './api';

const attendanceService = {
  getSessionRoster: (course, date) => api.get('/attendance/session', { params: { course, date } }).then((res) => res.data),
  markAttendance: (course, date, records) => api.post('/attendance', { course, date, records }).then((res) => res.data),
  getCourseSummary: (courseId) => api.get(`/attendance/course/${courseId}/summary`).then((res) => res.data),
  getMyAttendance: () => api.get('/attendance/me').then((res) => res.data),
  getMyCourseHistory: (courseId) => api.get(`/attendance/me/course/${courseId}`).then((res) => res.data),
};

export default attendanceService;
