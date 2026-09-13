const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudents,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Every course route requires a logged-in user; only Admin can
// create/update/delete/enroll. Read access is shared by all roles,
// but the controller itself scopes *which* courses each role can see.
router.use(protect);

router.route('/').get(getCourses).post(authorize('admin'), createCourse);

router.route('/:id').get(getCourseById).put(authorize('admin'), updateCourse).delete(authorize('admin'), deleteCourse);

router.post('/:id/enroll', authorize('admin'), enrollStudents);

module.exports = router;
