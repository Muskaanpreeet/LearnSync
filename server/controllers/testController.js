const asyncHandler = require('express-async-handler');
const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const Course = require('../models/Course');
const { notifyUsers } = require('../utils/notify');

const assertOwnsTest = (test, user, res) => {
  if (user.role === 'admin') return;
  if (test.teacher.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error('You do not own this test');
  }
};

// @desc    List tests. Teacher: own tests. Student: published tests
//          for enrolled courses, annotated with their own attempt
//          status. Admin: all.
// @route   GET /api/tests
// @access  Private
const getTests = asyncHandler(async (req, res) => {
  const { course, status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const query = {};
  if (course) query.course = course;

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
    if (status) query.status = status;
  } else if (req.user.role === 'student') {
    const enrolledCourses = await Course.find({ students: req.user._id }).select('_id');
    query.course = course ? course : { $in: enrolledCourses.map((c) => c._id) };
    query.status = 'published';
  } else if (status) {
    query.status = status;
  }

  const [tests, total] = await Promise.all([
    Test.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('questions', 'marks')
      .sort({ startDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Test.countDocuments(query),
  ]);

  let data = tests.map((t) => ({
    ...t.toObject(),
    totalMarks: t.questions.reduce((sum, q) => sum + q.marks, 0),
    questionCount: t.questions.length,
  }));

  if (req.user.role === 'student') {
    const attempts = await TestAttempt.find({ test: { $in: tests.map((t) => t._id) }, student: req.user._id });
    const byTest = new Map(attempts.map((a) => [a.test.toString(), a]));
    data = data.map((t) => {
      const attempt = byTest.get(t._id.toString());
      let attemptStatus = 'not-started';
      if (attempt?.status === 'submitted') attemptStatus = 'completed';
      else if (attempt) attemptStatus = 'in-progress';
      else if (new Date(t.endDate) < new Date()) attemptStatus = 'missed';
      return { ...t, attemptStatus, myScore: attempt?.status === 'submitted' ? attempt.score : null };
    });
  }

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Get one test. Teacher sees full detail including correct
//          answers (for editing). Student never receives
//          correctOptionIndex through this route — see getTestForAttempt.
// @route   GET /api/tests/:id
// @access  Private
const getTestById = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('course', 'name code students').populate('teacher', 'name');
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  if (req.user.role === 'teacher') {
    assertOwnsTest(test, req.user, res);
    const questions = await Question.find({ test: test._id }).sort({ order: 1 });
    return res.json({ success: true, data: { ...test.toObject(), questions } });
  }

  if (req.user.role === 'student') {
    const isEnrolled = test.course.students.some((id) => id.toString() === req.user._id.toString());
    if (!isEnrolled || test.status !== 'published') {
      res.status(403);
      throw new Error('You do not have access to this test');
    }
    // Students get metadata only here (no questions) — questions are
    // only handed out once they actually start the attempt.
    const questionCount = await Question.countDocuments({ test: test._id });
    return res.json({ success: true, data: { ...test.toObject(), questionCount } });
  }

  res.json({ success: true, data: test });
});

// @desc    Create a test
// @route   POST /api/tests
// @access  Private/Teacher
const createTest = asyncHandler(async (req, res) => {
  const { title, description, course, duration, startDate, endDate, status, resultVisibility } = req.body;
  if (!title || !course || !duration || !startDate || !endDate) {
    res.status(400);
    throw new Error('Title, course, duration, startDate, and endDate are required');
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    res.status(404);
    throw new Error('Course not found');
  }
  if (req.user.role === 'teacher' && (!courseDoc.teacher || courseDoc.teacher.toString() !== req.user._id.toString())) {
    res.status(403);
    throw new Error('You are not assigned to this course');
  }

  const test = await Test.create({
    title,
    description,
    course,
    teacher: req.user._id,
    duration,
    startDate,
    endDate,
    status: status === 'published' ? 'published' : 'draft',
    resultVisibility: resultVisibility || 'immediate',
  });

  res.status(201).json({ success: true, data: test });
});

// @desc    Update a test (including publish/unpublish)
// @route   PUT /api/tests/:id
// @access  Private/Teacher (owner) or Admin
const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  assertOwnsTest(test, req.user, res);
  const wasDraft = test.status === 'draft';

  const fields = ['title', 'description', 'duration', 'startDate', 'endDate', 'status', 'resultVisibility'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) test[f] = req.body[f];
  });

  await test.save();

  // Publishing is almost always done via update (questions get added
  // after creation), so this is where the "new test" notification fires.
  if (wasDraft && test.status === 'published') {
    const courseDoc = await Course.findById(test.course).select('students code');
    await notifyUsers(courseDoc.students, {
      type: 'test_new',
      title: 'New test available',
      message: `${test.title} is now available in ${courseDoc.code}. Closes ${new Date(test.endDate).toLocaleDateString()}.`,
      link: `tests/${test._id}/take`,
    });
  }

  res.json({ success: true, data: test });
});

// @desc    Delete a test, its questions, and any attempts
// @route   DELETE /api/tests/:id
// @access  Private/Teacher (owner) or Admin
const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  assertOwnsTest(test, req.user, res);

  await Question.deleteMany({ test: test._id });
  await TestAttempt.deleteMany({ test: test._id });
  await test.deleteOne();

  res.json({ success: true, message: 'Test deleted successfully' });
});

// @desc    Add a question to a test
// @route   POST /api/tests/:id/questions
// @access  Private/Teacher (owner) or Admin
const addQuestion = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  assertOwnsTest(test, req.user, res);

  const { text, options, correctOptionIndex, marks, order } = req.body;
  if (!text || !Array.isArray(options) || options.length < 2 || correctOptionIndex === undefined) {
    res.status(400);
    throw new Error('text, at least 2 options, and correctOptionIndex are required');
  }
  if (correctOptionIndex < 0 || correctOptionIndex >= options.length) {
    res.status(400);
    throw new Error('correctOptionIndex is out of range for the given options');
  }

  const question = await Question.create({
    test: test._id,
    text,
    options,
    correctOptionIndex,
    marks: marks || 1,
    order: order ?? 0,
  });

  res.status(201).json({ success: true, data: question });
});

// @desc    Update a question
// @route   PUT /api/tests/questions/:questionId
// @access  Private/Teacher (owner) or Admin
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.questionId).populate('test');
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  assertOwnsTest(question.test, req.user, res);

  const { text, options, correctOptionIndex, marks, order } = req.body;
  if (text !== undefined) question.text = text;
  if (options !== undefined) question.options = options;
  if (correctOptionIndex !== undefined) question.correctOptionIndex = correctOptionIndex;
  if (marks !== undefined) question.marks = marks;
  if (order !== undefined) question.order = order;

  await question.save();
  res.json({ success: true, data: question });
});

// @desc    Delete a question
// @route   DELETE /api/tests/questions/:questionId
// @access  Private/Teacher (owner) or Admin
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.questionId).populate('test');
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  assertOwnsTest(question.test, req.user, res);
  await question.deleteOne();
  res.json({ success: true, message: 'Question deleted' });
});

// @desc    Start (or resume) a test attempt. Returns questions WITHOUT
//          correctOptionIndex — the only place students receive
//          question data, and it deliberately strips the answer key.
// @route   POST /api/tests/:id/start
// @access  Private/Student
const startTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('course', 'students');
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  const isEnrolled = test.course.students.some((id) => id.toString() === req.user._id.toString());
  if (!isEnrolled || test.status !== 'published') {
    res.status(403);
    throw new Error('You do not have access to this test');
  }
  const now = new Date();
  if (now < new Date(test.startDate)) {
    res.status(400);
    throw new Error('This test has not started yet');
  }
  if (now > new Date(test.endDate)) {
    res.status(400);
    throw new Error('This test has closed');
  }

  let attempt = await TestAttempt.findOne({ test: test._id, student: req.user._id });
  if (attempt?.status === 'submitted') {
    res.status(400);
    throw new Error('You have already submitted this test');
  }
  if (!attempt) {
    attempt = await TestAttempt.create({ test: test._id, student: req.user._id, answers: [] });
  }

  const questions = await Question.find({ test: test._id }).select('-correctOptionIndex').sort({ order: 1 });

  // Remaining time is derived from when the attempt actually started,
  // so refreshing the page can't extend a student's time limit.
  const deadline = new Date(Math.min(new Date(attempt.startedAt).getTime() + test.duration * 60000, new Date(test.endDate).getTime()));

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      test: { _id: test._id, title: test.title, duration: test.duration },
      questions,
      deadline,
      existingAnswers: attempt.answers,
    },
  });
});

// @desc    Submit a test attempt — auto-grades objective (MCQ) questions.
// @route   POST /api/tests/:id/submit
// @access  Private/Student
const submitTest = asyncHandler(async (req, res) => {
  const { answers } = req.body; // [{ question, selectedOptionIndex }]
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  const attempt = await TestAttempt.findOne({ test: test._id, student: req.user._id });
  if (!attempt) {
    res.status(400);
    throw new Error('You have not started this test');
  }
  if (attempt.status === 'submitted') {
    res.status(400);
    throw new Error('You have already submitted this test');
  }

  const questions = await Question.find({ test: test._id });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  const gradedAnswers = (answers || []).map(({ question, selectedOptionIndex }) => {
    const q = questionMap.get(question);
    if (q && selectedOptionIndex === q.correctOptionIndex) score += q.marks;
    return { question, selectedOptionIndex: selectedOptionIndex ?? null };
  });

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  attempt.answers = gradedAnswers;
  attempt.score = score;
  attempt.totalMarks = totalMarks;
  attempt.status = 'submitted';
  attempt.submittedAt = new Date();
  await attempt.save();

  // Respect configured result visibility — if results only show after
  // the test window closes, don't hand the score back immediately.
  const showScore = test.resultVisibility === 'immediate' || new Date() > new Date(test.endDate);

  res.json({
    success: true,
    message: 'Test submitted successfully',
    data: showScore ? { score, totalMarks } : { message: 'Results will be available after the test closes for everyone.' },
  });
});

// @desc    Get the logged-in student's own result for a test —
//          401/403s if they try to fetch anyone else's by attempt ID,
//          since this always looks up by (test, req.user._id).
// @route   GET /api/tests/:id/my-result
// @access  Private/Student
const getMyResult = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  const attempt = await TestAttempt.findOne({ test: test._id, student: req.user._id });
  if (!attempt || attempt.status !== 'submitted') {
    res.status(404);
    throw new Error('No submitted attempt found');
  }

  const showScore = test.resultVisibility === 'immediate' || new Date() > new Date(test.endDate);
  if (!showScore) {
    return res.json({ success: true, data: { visible: false, message: 'Results will be available after the test closes.' } });
  }

  const questions = await Question.find({ test: test._id }).sort({ order: 1 });
  const answerMap = new Map(attempt.answers.map((a) => [a.question.toString(), a.selectedOptionIndex]));

  res.json({
    success: true,
    data: {
      visible: true,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      submittedAt: attempt.submittedAt,
      questions: questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        selectedOptionIndex: answerMap.get(q._id.toString()) ?? null,
        marks: q.marks,
      })),
    },
  });
});

// @desc    Teacher view of every student's attempt at a test.
// @route   GET /api/tests/:id/attempts
// @access  Private/Teacher (owner) or Admin
const getTestAttempts = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('course', 'students');
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  assertOwnsTest(test, req.user, res);

  const attempts = await TestAttempt.find({ test: test._id }).populate('student', 'name email rollNumber');
  const attemptedIds = new Set(attempts.map((a) => a.student._id.toString()));

  const User = require('../models/User');
  const enrolledStudents = await User.find({ _id: { $in: test.course.students } }, 'name email rollNumber');
  const notAttempted = enrolledStudents
    .filter((s) => !attemptedIds.has(s._id.toString()))
    .map((s) => ({ student: s, status: 'not-started', score: null, submittedAt: null }));

  res.json({ success: true, data: [...attempts, ...notAttempted] });
});

module.exports = {
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
};
