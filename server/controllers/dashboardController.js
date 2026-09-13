const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const StudyMaterial = require('../models/StudyMaterial');
const Result = require('../models/Result');

// @desc    Admin dashboard — institution-wide stats and chart data.
//          Every number here is a live query against the real
//          collections; nothing is precomputed or cached, so the
//          dashboard is never stale relative to the data driving it.
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();

  const [totalStudents, totalTeachers, totalCourses, activeCourses, pendingAssignments, upcomingTests, recentAnnouncements] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments({}),
      Course.countDocuments({ status: 'active' }),
      Assignment.countDocuments({ status: 'published', deadline: { $gte: now } }),
      Test.countDocuments({ status: 'published', endDate: { $gte: now } }),
      Announcement.find({ status: 'published' }).sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name').populate('course', 'code'),
    ]);

  // Course distribution by department — one aggregation, no app-side looping.
  const courseDistribution = await Course.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $project: { department: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);

  // Student enrollment by department.
  const studentsByDepartment = await User.aggregate([
    { $match: { role: 'student' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $project: { department: { $ifNull: ['$_id', 'Unspecified'] }, count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);

  // Platform-wide attendance overview: present vs. absent, across every record.
  const attendanceAgg = await Attendance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const attendanceOverview = { present: 0, absent: 0 };
  attendanceAgg.forEach((a) => (attendanceOverview[a._id] = a.count));

  // Assignment submission statistics across the whole platform.
  const submissionAgg = await Submission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const assignmentStats = { submitted: 0, late: 0, graded: 0 };
  submissionAgg.forEach((s) => (assignmentStats[s._id] = s.count));

  res.json({
    success: true,
    data: {
      stats: { totalStudents, totalTeachers, totalCourses, activeCourses, pendingAssignments, upcomingTests },
      charts: { courseDistribution, studentsByDepartment, attendanceOverview, assignmentStats },
      recentAnnouncements,
    },
  });
});

// @desc    Teacher dashboard — their own courses, submissions, tests,
//          and attendance, plus a per-course performance chart built
//          from published Result rows.
// @route   GET /api/dashboard/teacher
// @access  Private/Teacher
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const courses = await Course.find({ teacher: req.user._id });
  const courseIds = courses.map((c) => c._id);
  const totalStudents = new Set(courses.flatMap((c) => c.students.map((s) => s.toString()))).size;

  const [assignments, tests, recentAnnouncements] = await Promise.all([
    Assignment.find({ teacher: req.user._id }).select('_id'),
    Test.find({ teacher: req.user._id }).select('_id'),
    Announcement.find({ $or: [{ createdBy: req.user._id }, { course: { $in: courseIds } }] })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('course', 'code'),
  ]);

  const pendingSubmissions = await Submission.countDocuments({
    assignment: { $in: assignments.map((a) => a._id) },
    status: { $in: ['submitted', 'late'] },
  });
  const upcomingTests = await Test.countDocuments({
    teacher: req.user._id,
    status: 'published',
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  // Attendance overview across this teacher's own courses only.
  const attendanceAgg = await Attendance.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const attendanceOverview = { present: 0, absent: 0 };
  attendanceAgg.forEach((a) => (attendanceOverview[a._id] = a.count));

  // Average published-result percentage per course, for the "student
  // performance" chart the spec calls for on the teacher dashboard.
  const studentPerformance = await Promise.all(
    courses.map(async (course) => {
      const results = await Result.find({ course: course._id, status: 'published' });
      const percentages = results.map((r) => (r.marksObtained / r.maxMarks) * 100);
      const average = percentages.length > 0 ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10 : 0;
      return { course: course.code, average };
    })
  );

  res.json({
    success: true,
    data: {
      stats: {
        assignedCourses: courses.length,
        totalStudents,
        pendingSubmissions,
        upcomingTests,
      },
      charts: { attendanceOverview, studentPerformance },
      recentAnnouncements,
    },
  });
});

// @desc    Student dashboard — their own enrolled courses, upcoming
//          deadlines, attendance, and recent results/announcements.
// @route   GET /api/dashboard/student
// @access  Private/Student
const getStudentDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const courses = await Course.find({ students: req.user._id });
  const courseIds = courses.map((c) => c._id);

  const [upcomingAssignments, upcomingTests, recentAnnouncements, recentMaterials] = await Promise.all([
    Assignment.find({ course: { $in: courseIds }, status: 'published', deadline: { $gte: now } })
      .sort({ deadline: 1 })
      .limit(5)
      .populate('course', 'code'),
    Test.find({ course: { $in: courseIds }, status: 'published', endDate: { $gte: now } })
      .sort({ startDate: 1 })
      .limit(5)
      .populate('course', 'code'),
    Announcement.find({
      $or: [{ course: { $in: courseIds } }, { course: null, audience: { $in: ['everyone', 'students'] } }],
      status: 'published',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('course', 'code'),
    StudyMaterial.find({ course: { $in: courseIds } }).sort({ createdAt: -1 }).limit(5).populate('course', 'code'),
  ]);

  // Overall attendance percentage across every enrolled course.
  const attendanceRecords = await Attendance.find({ course: { $in: courseIds }, student: req.user._id });
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const attendancePercentage = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

  // Recent published results across every enrolled course.
  const recentResults = await Result.find({ student: req.user._id, status: 'published' }).sort({ updatedAt: -1 }).limit(5).populate(
    'course',
    'code'
  );

  res.json({
    success: true,
    data: {
      stats: {
        enrolledCourses: courses.length,
        attendancePercentage,
        upcomingAssignments: upcomingAssignments.length,
        upcomingTests: upcomingTests.length,
      },
      upcomingAssignments,
      upcomingTests,
      recentResults,
      recentAnnouncements,
      recentMaterials,
    },
  });
});

module.exports = { getAdminDashboard, getTeacherDashboard, getStudentDashboard };
