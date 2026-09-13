import api from './api';

const testService = {
  getTests: (params) => api.get('/tests', { params }).then((res) => res.data),
  getTestById: (id) => api.get(`/tests/${id}`).then((res) => res.data),
  createTest: (data) => api.post('/tests', data).then((res) => res.data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data).then((res) => res.data),
  deleteTest: (id) => api.delete(`/tests/${id}`).then((res) => res.data),

  addQuestion: (testId, data) => api.post(`/tests/${testId}/questions`, data).then((res) => res.data),
  updateQuestion: (questionId, data) => api.put(`/tests/questions/${questionId}`, data).then((res) => res.data),
  deleteQuestion: (questionId) => api.delete(`/tests/questions/${questionId}`).then((res) => res.data),

  getTestAttempts: (testId) => api.get(`/tests/${testId}/attempts`).then((res) => res.data),

  startTest: (testId) => api.post(`/tests/${testId}/start`).then((res) => res.data),
  submitTest: (testId, answers) => api.post(`/tests/${testId}/submit`, { answers }).then((res) => res.data),
  getMyResult: (testId) => api.get(`/tests/${testId}/my-result`).then((res) => res.data),
};

export default testService;
