import api from './api';

// All course-related HTTP calls live here. Query params are passed
// straight through — the backend (getCourses) defines what's valid
// (search, department, semester, status, teacher, page, limit).
const courseService = {
  getCourses: (params) => api.get('/courses', { params }).then((res) => res.data),
  getCourseById: (id) => api.get(`/courses/${id}`).then((res) => res.data),
  createCourse: (data) => api.post('/courses', data).then((res) => res.data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data).then((res) => res.data),
  deleteCourse: (id) => api.delete(`/courses/${id}`).then((res) => res.data),
  enrollStudents: (id, studentIds) => api.post(`/courses/${id}/enroll`, { studentIds }).then((res) => res.data),
};

export default courseService;
