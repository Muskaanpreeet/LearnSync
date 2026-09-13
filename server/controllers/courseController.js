const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    List courses with search, filters, and pagination.
//          Admin sees everything; Teacher sees only assigned courses;
//          Student sees only enrolled courses — enforced server-side
//          so a role can never fetch courses it shouldn't see.
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  const { search, department, semester, status, teacher, page = 1, limit = 10 } = req.query;

  const query = {};

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    query.students = req.user._id;
  }
  // Admin: no restriction — sees all courses, and can still filter by `teacher` below.

  if (search) {
    query.$text = { $search: search };
  }
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (status) query.status = status;
  if (teacher && req.user.role === 'admin') query.teacher = teacher;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('teacher', 'name email department')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Course.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: courses,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Get a single course, populated with teacher + student roster
// @route   GET /api/courses/:id
// @access  Private (admin: any course; teacher: own course; student: enrolled course)
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('teacher', 'name email department designation')
    .populate('students', 'name email rollNumber');

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Extra authorization beyond role: a teacher/student can only open a
  // course they're actually attached to, not just any course by ID.
  if (req.user.role === 'teacher' && (!course.teacher || course.teacher._id.toString() !== req.user._id.toString())) {
    res.status(403);
    throw new Error('You are not assigned to this course');
  }
  if (req.user.role === 'student' && !course.students.some((s) => s._id.toString() === req.user._id.toString())) {
    res.status(403);
    throw new Error('You are not enrolled in this course');
  }

  res.json({ success: true, data: course });
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
  const { name, code, description, department, semester, credits, teacher } = req.body;

  if (!name || !code || !department || !semester || !credits) {
    res.status(400);
    throw new Error('Name, code, department, semester, and credits are required');
  }

  if (teacher) {
    const teacherDoc = await User.findOne({ _id: teacher, role: 'teacher' });
    if (!teacherDoc) {
      res.status(400);
      throw new Error('Selected teacher does not exist');
    }
  }

  const course = await Course.create({
    name,
    code,
    description,
    department,
    semester,
    credits,
    teacher: teacher || null,
    createdBy: req.user._id,
  });

  // Keep the two-way reference in sync
  if (teacher) {
    await User.findByIdAndUpdate(teacher, { $addToSet: { assignedCourses: course._id } });
  }

  res.status(201).json({ success: true, data: course });
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const { name, code, description, department, semester, credits, status, teacher } = req.body;

  // If the teacher assignment changed, update both sides of the reference.
  if (teacher !== undefined && String(teacher) !== String(course.teacher)) {
    if (course.teacher) {
      await User.findByIdAndUpdate(course.teacher, { $pull: { assignedCourses: course._id } });
    }
    if (teacher) {
      const teacherDoc = await User.findOne({ _id: teacher, role: 'teacher' });
      if (!teacherDoc) {
        res.status(400);
        throw new Error('Selected teacher does not exist');
      }
      await User.findByIdAndUpdate(teacher, { $addToSet: { assignedCourses: course._id } });
    }
    course.teacher = teacher || null;
  }

  if (name !== undefined) course.name = name;
  if (code !== undefined) course.code = code;
  if (description !== undefined) course.description = description;
  if (department !== undefined) course.department = department;
  if (semester !== undefined) course.semester = semester;
  if (credits !== undefined) course.credits = credits;
  if (status !== undefined) course.status = status;

  await course.save();
  res.json({ success: true, data: course });
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  // Clean up references on both sides so no user points at a deleted course.
  await User.updateMany({ assignedCourses: course._id }, { $pull: { assignedCourses: course._id } });
  await User.updateMany({ enrolledCourses: course._id }, { $pull: { enrolledCourses: course._id } });
  await course.deleteOne();

  res.json({ success: true, message: 'Course deleted successfully' });
});

// @desc    Enroll one or more students into a course
// @route   POST /api/courses/:id/enroll
// @access  Private/Admin
const enrollStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body; // array of User _ids
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400);
    throw new Error('studentIds must be a non-empty array');
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const validStudents = await User.find({ _id: { $in: studentIds }, role: 'student' });
  const validIds = validStudents.map((s) => s._id);

  course.students.addToSet(...validIds);
  await course.save();

  await User.updateMany({ _id: { $in: validIds } }, { $addToSet: { enrolledCourses: course._id } });

  res.json({ success: true, data: course, enrolledCount: validIds.length });
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudents,
};
