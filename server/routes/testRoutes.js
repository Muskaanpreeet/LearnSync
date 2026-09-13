const express = require('express');
const router = express.Router();
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  startTest,
  submitTest,
  getMyResult,
  getTestAttempts,
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTests).post(authorize('teacher', 'admin'), createTest);

// Question mutation acts on a question, not a test, but lives in this
// router since it's part of the same feature. Different path shape
// (/questions/:questionId) than /:id, so no route-order conflict.
router.put('/questions/:questionId', authorize('teacher', 'admin'), updateQuestion);
router.delete('/questions/:questionId', authorize('teacher', 'admin'), deleteQuestion);

router
  .route('/:id')
  .get(getTestById)
  .put(authorize('teacher', 'admin'), updateTest)
  .delete(authorize('teacher', 'admin'), deleteTest);

router.post('/:id/questions', authorize('teacher', 'admin'), addQuestion);
router.get('/:id/attempts', authorize('teacher', 'admin'), getTestAttempts);

router.post('/:id/start', authorize('student'), startTest);
router.post('/:id/submit', authorize('student'), submitTest);
router.get('/:id/my-result', authorize('student'), getMyResult);

module.exports = router;
