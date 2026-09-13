const asyncHandler = require('express-async-handler');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const User = require('../models/User');
const { percentageToGrade } = require('../utils/grade');
const { notifyUsers } = require('../utils/notify');

const assertOwnsCourse = async (courseId, user, res) => {
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }
  if (user.role === 'teacher' && (!course.teacher || course.teacher.toString() !== user._id.toString())) {
    res.status(403);
    throw new Error('You are not assigned to this course');
  }
  return course;
};

// @desc    Roster for one exam title in a course, merged with any
//          marks already entered — mirrors the Attendance module's
//          session-roster pattern so re-opening an exam to edit marks
//          works the same way.
// @route   GET /api/results/roster?course=&title=
// @access  Private/Teacher (owner) or Admin
const getExamRoster = asyncHandler(async (req, res) => {
  const { course: courseId, title } = req.query;
  if (!courseId || !title) {
    res.status(400);
    throw new Error('course and title are required');
  }
  const course = await assertOwnsCourse(courseId, req.user, res);
  await course.populate('students', 'name email rollNumber');

  const existing = await Result.find({ course: courseId, title });
  const byStudent = new Map(existing.map((r) => [r.student.toString(), r]));

  const roster = course.students.map((s) => {
    const r = byStudent.get(s._id.toString());
    return {
      student: { _id: s._id, name: s.name, email: s.email, rollNumber: s.rollNumber },
      marksObtained: r ? r.marksObtained : null,
    };
  });

  const sample = existing[0];
  res.json({
    success: true,
    data: { roster, examType: sample?.examType || 'other', maxMarks: sample?.maxMarks || 100, status: sample?.status || 'draft' },
  });
});

// @desc    Enter or edit marks for a whole exam at once (bulk upsert,
//          same approach as Attendance's markAttendance).
// @route   POST /api/results
// @access  Private/Teacher (owner) or Admin
const enterMarks = asyncHandler(async (req, res) => {
  const { course: courseId, title, examType, maxMarks, status, records } = req.body;
  if (!courseId || !title || !maxMarks || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('course, title, maxMarks, and a non-empty records array are required');
  }
  await assertOwnsCourse(courseId, req.user, res);

  const operations = records
    .filter((r) => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== '')
    .map(({ student, marksObtained }) => ({
      updateOne: {
        filter: { course: courseId, student, title },
        update: {
          $set: {
            marksObtained,
            maxMarks,
            examType: examType || 'other',
            status: status === 'published' ? 'published' : 'draft',
            teacher: req.user._id,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length > 0) await Result.bulkWrite(operations);

  // Only notify when marks are actually published — entering
  // provisional/draft marks shouldn't alert students yet.
  if (status === 'published' && operations.length > 0) {
    const studentIds = records
      .filter((r) => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== '')
      .map((r) => r.student);
    await notifyUsers(studentIds, {
      type: 'result_published',
      title: 'Marks published',
      message: `Marks for "${title}" have been published.`,
      link: `results/${courseId}`,
    });
  }

  res.json({ success: true, message: `Marks saved for ${operations.length} student(s)` });
});

// @desc    List every exam title entered for a course with summary
//          stats — the teacher's "manage results" overview.
// @route   GET /api/results/course/:courseId/exams
// @access  Private/Teacher (owner) or Admin
const getCourseExams = asyncHandler(async (req, res) => {
  await assertOwnsCourse(req.params.courseId, req.user, res);

  const results = await Result.find({ course: req.params.courseId });
  const byTitle = new Map();
  for (const r of results) {
    if (!byTitle.has(r.title)) byTitle.set(r.title, { title: r.title, examType: r.examType, maxMarks: r.maxMarks, status: r.status, marks: [] });
    byTitle.get(r.title).marks.push(r.marksObtained);
  }

  const exams = Array.from(byTitle.values()).map((e) => ({
    title: e.title,
    examType: e.examType,
    maxMarks: e.maxMarks,
    status: e.status,
    studentCount: e.marks.length,
    average: e.marks.length > 0 ? Math.round((e.marks.reduce((a, b) => a + b, 0) / e.marks.length) * 10) / 10 : 0,
  }));

  res.json({ success: true, data: exams });
});

// @desc    Edit a single student's result row
// @route   PUT /api/results/:id
// @access  Private/Teacher (owner) or Admin
const updateResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) {
    res.status(404);
    throw new Error('Result not found');
  }
  if (req.user.role === 'teacher' && result.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not own this result');
  }

  const { marksObtained, maxMarks, status } = req.body;
  if (marksObtained !== undefined) result.marksObtained = marksObtained;
  if (maxMarks !== undefined) result.maxMarks = maxMarks;
  if (status !== undefined) result.status = status;
  await result.save();

  res.json({ success: true, data: result });
});

// @desc    Delete an entire exam (all students' rows for that title) from a course.
// @route   DELETE /api/results/course/:courseId/exam?title=
// @access  Private/Teacher (owner) or Admin
const deleteExam = asyncHandler(async (req, res) => {
  await assertOwnsCourse(req.params.courseId, req.user, res);
  const { title } = req.query;
  if (!title) {
    res.status(400);
    throw new Error('title is required');
  }
  await Result.deleteMany({ course: req.params.courseId, title });
  res.json({ success: true, message: 'Exam results deleted' });
});

// @desc    Course-level performance stats for charts (average per
//          exam, so a teacher can see trends across assessments).
// @route   GET /api/results/course/:courseId/performance
// @access  Private/Teacher (owner) or Admin
const getCoursePerformance = asyncHandler(async (req, res) => {
  await assertOwnsCourse(req.params.courseId, req.user, res);

  const results = await Result.find({ course: req.params.courseId });
  const byTitle = new Map();
  for (const r of results) {
    if (!byTitle.has(r.title)) byTitle.set(r.title, []);
    byTitle.get(r.title).push((r.marksObtained / r.maxMarks) * 100);
  }
  const examTrend = Array.from(byTitle.entries()).map(([title, percentages]) => ({
    title,
    averagePercentage: Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10,
  }));

  res.json({ success: true, data: { examTrend } });
});

// Shared helper: build one course's consolidated performance for a
// student — combines manually entered Results, graded Assignment
// submissions, and submitted Test attempts into one percentage/grade.
const buildCoursePerformance = async (courseId, studentId) => {
  const [examResults, assignments, tests] = await Promise.all([
    Result.find({ course: courseId, student: studentId, status: 'published' }),
    Assignment.find({ course: courseId, status: 'published' }),
    Test.find({ course: courseId, status: 'published' }),
  ]);

  const assignmentIds = assignments.map((a) => a._id);
  const gradedSubmissions = await Submission.find({
    assignment: { $in: assignmentIds },
    student: studentId,
    status: 'graded',
  }).populate('assignment', 'title maxMarks');

  const testIds = tests.map((t) => t._id);
  const submittedAttempts = await TestAttempt.find({
    test: { $in: testIds },
    student: studentId,
    status: 'submitted',
  }).populate('test', 'title');

  const components = [
    ...examResults.map((r) => ({ label: r.title, type: 'exam', obtained: r.marksObtained, max: r.maxMarks })),
    ...gradedSubmissions.map((s) => ({ label: s.assignment.title, type: 'assignment', obtained: s.marks, max: s.assignment.maxMarks })),
    ...submittedAttempts.map((a) => ({ label: a.test.title, type: 'test', obtained: a.score, max: a.totalMarks })),
  ];

  const totalObtained = components.reduce((sum, c) => sum + (c.obtained || 0), 0);
  const totalMax = components.reduce((sum, c) => sum + (c.max || 0), 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;

  return { components, totalObtained, totalMax, percentage, grade: percentageToGrade(percentage) };
};

// @desc    The logged-in student's consolidated performance across
//          every enrolled course (exams + assignments + tests
//          combined into one percentage and grade per course).
// @route   GET /api/results/me
// @access  Private/Student
const getMyPerformance = asyncHandler(async (req, res) => {
  const courses = await Course.find({ students: req.user._id }).select('name code');

  const data = await Promise.all(
    courses.map(async (course) => {
      const perf = await buildCoursePerformance(course._id, req.user._id);
      return { course: { _id: course._id, name: course.name, code: course.code }, ...perf };
    })
  );

  res.json({ success: true, data });
});

// @desc    The logged-in student's detailed subject-wise performance
//          breakdown for one course (every exam/assignment/test component).
// @route   GET /api/results/me/course/:courseId
// @access  Private/Student
const getMyCoursePerformance = asyncHandler(async (req, res) => {
  const isEnrolled = await Course.exists({ _id: req.params.courseId, students: req.user._id });
  if (!isEnrolled) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }
  const perf = await buildCoursePerformance(req.params.courseId, req.user._id);
  res.json({ success: true, data: perf });
});

module.exports = {
  getExamRoster,
  enterMarks,
  getCourseExams,
  updateResult,
  deleteExam,
  getCoursePerformance,
  getMyPerformance,
  getMyCoursePerformance,
};
