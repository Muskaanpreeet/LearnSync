const express = require('express');
const router = express.Router();
const {
  getExamRoster,
  enterMarks,
  getCourseExams,
  updateResult,
  deleteExam,
  getCoursePerformance,
  getMyPerformance,
  getMyCoursePerformance,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student's own consolidated views — placed before the parameterized
// teacher routes below to avoid any path-shape ambiguity.
router.get('/me', authorize('student'), getMyPerformance);
router.get('/me/course/:courseId', authorize('student'), getMyCoursePerformance);

// Teacher/Admin marks entry + management
router.get('/roster', authorize('teacher', 'admin'), getExamRoster);
router.post('/', authorize('teacher', 'admin'), enterMarks);
router.put('/:id', authorize('teacher', 'admin'), updateResult);
router.get('/course/:courseId/exams', authorize('teacher', 'admin'), getCourseExams);
router.get('/course/:courseId/performance', authorize('teacher', 'admin'), getCoursePerformance);
router.delete('/course/:courseId/exam', authorize('teacher', 'admin'), deleteExam);

module.exports = router;
