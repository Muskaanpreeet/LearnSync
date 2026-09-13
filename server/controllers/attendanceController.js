const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

const THRESHOLD = Number(process.env.ATTENDANCE_WARNING_THRESHOLD) || 75;

// Normalizes any incoming date string to midnight UTC so "same day"
// is a plain equality check instead of a $gte/$lt range query, and so
// marking the same day twice reliably hits the same document via the
// unique (course, student, date) index.
const toMidnightUTC = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

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

// @desc    Get the enrolled-student roster for a course/date, merged
//          with any attendance already marked for that day — this is
//          what populates the "mark attendance" screen, including when
//          a teacher reopens a day to edit it.
// @route   GET /api/attendance/session?course=&date=
// @access  Private/Teacher (owner) or Admin
const getSessionRoster = asyncHandler(async (req, res) => {
  const { course: courseId, date } = req.query;
  if (!courseId || !date) {
    res.status(400);
    throw new Error('course and date are required');
  }

  const course = await assertOwnsCourse(courseId, req.user, res);
  await course.populate('students', 'name email rollNumber');

  const day = toMidnightUTC(date);
  const existing = await Attendance.find({ course: courseId, date: day });
  const byStudent = new Map(existing.map((r) => [r.student.toString(), r.status]));

  const roster = course.students.map((s) => ({
    student: { _id: s._id, name: s.name, email: s.email, rollNumber: s.rollNumber },
    status: byStudent.get(s._id.toString()) || null, // null = not yet marked
  }));

  res.json({ success: true, data: { course: { _id: course._id, name: course.name, code: course.code }, date: day, roster } });
});

// @desc    Mark (or edit) attendance for a course on a given date.
//          Upserts one row per student so re-marking the same day
//          updates existing rows instead of creating duplicates.
// @route   POST /api/attendance
// @access  Private/Teacher (owner) or Admin
const markAttendance = asyncHandler(async (req, res) => {
  const { course: courseId, date, records } = req.body;
  if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error('course, date, and a non-empty records array are required');
  }

  await assertOwnsCourse(courseId, req.user, res);
  const day = toMidnightUTC(date);

  const operations = records.map(({ student, status }) => ({
    updateOne: {
      filter: { course: courseId, student, date: day },
      update: { $set: { status, markedBy: req.user._id } },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);
  res.json({ success: true, message: `Attendance saved for ${records.length} student(s)` });
});

// @desc    Per-student attendance summary for a course (teacher's
//          course-level view): total sessions held, present count, %.
// @route   GET /api/attendance/course/:courseId/summary
// @access  Private/Teacher (owner) or Admin
const getCourseSummary = asyncHandler(async (req, res) => {
  const course = await assertOwnsCourse(req.params.courseId, req.user, res);
  await course.populate('students', 'name email rollNumber');

  const totalSessions = (await Attendance.distinct('date', { course: course._id })).length;

  const records = await Attendance.find({ course: course._id });
  const byStudent = new Map();
  for (const r of records) {
    const key = r.student.toString();
    if (!byStudent.has(key)) byStudent.set(key, { present: 0, total: 0 });
    byStudent.get(key).total += 1;
    if (r.status === 'present') byStudent.get(key).present += 1;
  }

  const summary = course.students.map((s) => {
    const stats = byStudent.get(s._id.toString()) || { present: 0, total: 0 };
    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    return {
      student: { _id: s._id, name: s.name, rollNumber: s.rollNumber },
      present: stats.present,
      total: stats.total,
      percentage,
      belowThreshold: stats.total > 0 && percentage < THRESHOLD,
    };
  });

  res.json({ success: true, data: { totalSessions, threshold: THRESHOLD, students: summary } });
});

// @desc    The logged-in student's attendance percentage across every
//          enrolled course — powers the student dashboard overview.
// @route   GET /api/attendance/me
// @access  Private/Student
const getMyAttendance = asyncHandler(async (req, res) => {
  const courses = await Course.find({ students: req.user._id }).select('name code');

  const results = await Promise.all(
    courses.map(async (course) => {
      const records = await Attendance.find({ course: course._id, student: req.user._id });
      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        course: { _id: course._id, name: course.name, code: course.code },
        present,
        total,
        percentage,
        belowThreshold: total > 0 && percentage < THRESHOLD,
      };
    })
  );

  res.json({ success: true, data: results, threshold: THRESHOLD });
});

// @desc    The logged-in student's full attendance history for one course.
// @route   GET /api/attendance/me/course/:courseId
// @access  Private/Student
const getMyCourseHistory = asyncHandler(async (req, res) => {
  const isEnrolled = await Course.exists({ _id: req.params.courseId, students: req.user._id });
  if (!isEnrolled) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  const records = await Attendance.find({ course: req.params.courseId, student: req.user._id }).sort({ date: -1 });
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;

  res.json({
    success: true,
    data: {
      records: records.map((r) => ({ date: r.date, status: r.status })),
      present,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      threshold: THRESHOLD,
    },
  });
});

module.exports = {
  getSessionRoster,
  markAttendance,
  getCourseSummary,
  getMyAttendance,
  getMyCourseHistory,
};
