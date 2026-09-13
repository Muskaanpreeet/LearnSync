import api from './api';

// Two endpoints here (create/update/submit/grade) send multipart form
// data because they may include a file — Axios sets the correct
// multipart Content-Type automatically when given a FormData body, so
// we don't set headers manually.
const assignmentService = {
  getAssignments: (params) => api.get('/assignments', { params }).then((res) => res.data),
  getAssignmentById: (id) => api.get(`/assignments/${id}`).then((res) => res.data),
  createAssignment: (formData) => api.post('/assignments', formData).then((res) => res.data),
  updateAssignment: (id, formData) => api.put(`/assignments/${id}`, formData).then((res) => res.data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`).then((res) => res.data),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`).then((res) => res.data),
  submitAssignment: (assignmentId, formData) =>
    api.post(`/assignments/${assignmentId}/submit`, formData).then((res) => res.data),
  gradeSubmission: (submissionId, data) =>
    api.put(`/assignments/submissions/${submissionId}/grade`, data).then((res) => res.data),
};

export default assignmentService;
