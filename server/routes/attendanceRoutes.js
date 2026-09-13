const express = require('express');
const router = express.Router();
const {
  getSessionRoster,
  markAttendance,
  getCourseSummary,
  getMyAttendance,
  getMyCourseHistory,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Student's own views — must come before the teacher/admin routes
// below since they don't take a `course` query param the same way.
router.get('/me', authorize('student'), getMyAttendance);
router.get('/me/course/:courseId', authorize('student'), getMyCourseHistory);

// Teacher/Admin marking + summaries
router.get('/session', authorize('teacher', 'admin'), getSessionRoster);
router.post('/', authorize('teacher', 'admin'), markAttendance);
router.get('/course/:courseId/summary', authorize('teacher', 'admin'), getCourseSummary);

module.exports = router;
