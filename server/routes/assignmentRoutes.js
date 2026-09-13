const express = require('express');
const router = express.Router();
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const createUploader = require('../middleware/upload');

const assignmentUpload = createUploader('assignments');
const submissionUpload = createUploader('submissions');

router.use(protect);

router
  .route('/')
  .get(getAssignments)
  .post(authorize('teacher', 'admin'), assignmentUpload.single('attachment'), createAssignment);

router
  .route('/:id')
  .get(getAssignmentById)
  .put(authorize('teacher', 'admin'), assignmentUpload.single('attachment'), updateAssignment)
  .delete(authorize('teacher', 'admin'), deleteAssignment);

router.get('/:id/submissions', authorize('teacher', 'admin'), getSubmissions);
router.post('/:id/submit', authorize('student'), submissionUpload.single('file'), submitAssignment);

// Grading acts on a submission, not an assignment, but is kept in this
// router since it's part of the same feature and needs the same upload setup file.
router.put('/submissions/:id/grade', authorize('teacher', 'admin'), gradeSubmission);

module.exports = router;
