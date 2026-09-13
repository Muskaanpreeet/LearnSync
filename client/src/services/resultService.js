import api from './api';

const resultService = {
  getExamRoster: (course, title) => api.get('/results/roster', { params: { course, title } }).then((res) => res.data),
  enterMarks: (payload) => api.post('/results', payload).then((res) => res.data),
  updateResult: (id, data) => api.put(`/results/${id}`, data).then((res) => res.data),
  getCourseExams: (courseId) => api.get(`/results/course/${courseId}/exams`).then((res) => res.data),
  getCoursePerformance: (courseId) => api.get(`/results/course/${courseId}/performance`).then((res) => res.data),
  deleteExam: (courseId, title) => api.delete(`/results/course/${courseId}/exam`, { params: { title } }).then((res) => res.data),
  getMyPerformance: () => api.get('/results/me').then((res) => res.data),
  getMyCoursePerformance: (courseId) => api.get(`/results/me/course/${courseId}`).then((res) => res.data),
};

export default resultService;
