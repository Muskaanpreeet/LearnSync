const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const { notifyUsers } = require('../utils/notify');

// Shared helper: only the teacher who owns the assignment's course
// (or an admin) may mutate it. Reused by update/delete/grade so the
// ownership rule lives in one place. Takes `res` so it can set the
// correct status code before throwing (the error handler falls back
// to 500 for anything that reaches it with the default 200 status).
const assertOwnsAssignment = (assignment, user, res) => {
  if (user.role === 'admin') return;
  if (assignment.teacher.toString() !== user._id.toString()) {
    res.status(403);
    throw new Error('You do not own this assignment');
  }
};

// @desc    List assignments. Teacher: own assignments (optionally
//          filtered by course/status). Student: published assignments
//          for courses they're enrolled in, each annotated with their
//          own submission status. Admin: everything.
// @route   GET /api/assignments
// @access  Private
const getAssignments = asyncHandler(async (req, res) => {
  const { course, status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const query = {};
  if (course) query.course = course;

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
    if (status) query.status = status;
  } else if (req.user.role === 'student') {
    // Only assignments belonging to courses this student is enrolled in.
    const enrolledCourses = await Course.find({ students: req.user._id }).select('_id');
    query.course = course ? course : { $in: enrolledCourses.map((c) => c._id) };
    query.status = 'published'; // students never see drafts
  } else if (status) {
    query.status = status;
  }

  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .sort({ deadline: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Assignment.countDocuments(query),
  ]);

  let data = assignments;

  // For students, merge in their own submission (or lack thereof) so
  // the list can show Pending / Submitted / Late / Graded without a
  // second round-trip per assignment.
  if (req.user.role === 'student') {
    const submissions = await Submission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: req.user._id,
    });
    const byAssignment = new Map(submissions.map((s) => [s.assignment.toString(), s]));

    data = assignments.map((a) => {
      const sub = byAssignment.get(a._id.toString());
      let submissionStatus = 'pending';
      if (sub) submissionStatus = sub.status;
      else if (new Date(a.deadline) < new Date()) submissionStatus = 'late'; // deadline passed, never submitted

      return {
        ...a.toObject(),
        mySubmission: sub
          ? { status: sub.status, marks: sub.marks, feedback: sub.feedback, submittedAt: sub.submittedAt }
          : null,
        submissionStatus,
      };
    });
  }

  res.json({
    success: true,
    data,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Get a single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'name code students').populate('teacher', 'name');
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (req.user.role === 'student') {
    const isEnrolled = assignment.course.students.some((id) => id.toString() === req.user._id.toString());
    if (!isEnrolled || assignment.status !== 'published') {
      res.status(403);
      throw new Error('You do not have access to this assignment');
    }
  }
  if (req.user.role === 'teacher') {
    assertOwnsAssignment(assignment, req.user, res);
  }

  res.json({ success: true, data: assignment });
});

// @desc    Create an assignment (optionally with a file attachment)
// @route   POST /api/assignments
// @access  Private/Teacher
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, course, deadline, maxMarks, status } = req.body;

  if (!title || !course || !deadline) {
    res.status(400);
    throw new Error('Title, course, and deadline are required');
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

  const assignment = await Assignment.create({
    title,
    description,
    course,
    teacher: req.user._id,
    deadline,
    maxMarks: maxMarks || 100,
    status: status === 'published' ? 'published' : 'draft',
    attachment: req.file
      ? { url: req.file.path, publicId: req.file.filename, originalName: req.file.originalname }
      : undefined,
  });

  // Notify every enrolled student the moment a new assignment goes
  // live — not for drafts, since students shouldn't be told about
  // something they can't even see yet.
  if (assignment.status === 'published') {
    await notifyUsers(courseDoc.students, {
      type: 'assignment_new',
      title: 'New assignment posted',
      message: `${title} has been posted in ${courseDoc.code}. Due ${new Date(deadline).toLocaleDateString()}.`,
      link: `assignments/${assignment._id}`,
    });
  }

  res.status(201).json({ success: true, data: assignment });
});

// @desc    Update an assignment (title/description/deadline/marks/status, and optionally replace the attachment)
// @route   PUT /api/assignments/:id
// @access  Private/Teacher (owner) or Admin
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  assertOwnsAssignment(assignment, req.user, res);
  const wasDraft = assignment.status === 'draft';

  const { title, description, deadline, maxMarks, status } = req.body;
  if (title !== undefined) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (deadline !== undefined) assignment.deadline = deadline;
  if (maxMarks !== undefined) assignment.maxMarks = maxMarks;
  if (status !== undefined) assignment.status = status;

  // Replacing the attachment: delete the old Cloudinary file first so
  // we don't leak orphaned files with every re-upload.
  if (req.file) {
    if (assignment.attachment?.publicId) {
      await cloudinary.uploader.destroy(assignment.attachment.publicId, { resource_type: 'auto' }).catch(() => {});
    }
    assignment.attachment = { url: req.file.path, publicId: req.file.filename, originalName: req.file.originalname };
  }

  await assignment.save();

  // Only fires the moment a draft flips to published — editing an
  // already-published assignment doesn't re-notify everyone.
  if (wasDraft && assignment.status === 'published') {
    const courseDoc = await Course.findById(assignment.course).select('students code');
    await notifyUsers(courseDoc.students, {
      type: 'assignment_new',
      title: 'New assignment posted',
      message: `${assignment.title} has been posted in ${courseDoc.code}. Due ${new Date(assignment.deadline).toLocaleDateString()}.`,
      link: `assignments/${assignment._id}`,
    });
  }

  res.json({ success: true, data: assignment });
});

// @desc    Delete an assignment (and its Cloudinary attachment + submissions)
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher (owner) or Admin
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  assertOwnsAssignment(assignment, req.user, res);

  if (assignment.attachment?.publicId) {
    await cloudinary.uploader.destroy(assignment.attachment.publicId, { resource_type: 'auto' }).catch(() => {});
  }

  const submissions = await Submission.find({ assignment: assignment._id });
  for (const sub of submissions) {
    if (sub.file?.publicId) {
      await cloudinary.uploader.destroy(sub.file.publicId, { resource_type: 'auto' }).catch(() => {});
    }
  }
  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.json({ success: true, message: 'Assignment deleted successfully' });
});

// @desc    List all submissions for an assignment, including students
//          who haven't submitted yet (marked "pending"/"late"), so the
//          teacher sees one complete roster.
// @route   GET /api/assignments/:id/submissions
// @access  Private/Teacher (owner) or Admin
const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'students');
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  assertOwnsAssignment(assignment, req.user, res);

  const submissions = await Submission.find({ assignment: assignment._id }).populate('student', 'name email rollNumber');
  const submittedIds = new Set(submissions.map((s) => s.student._id.toString()));

  const enrolledStudents = await require('../models/User').find({ _id: { $in: assignment.course.students } }, 'name email rollNumber');

  const notSubmitted = enrolledStudents
    .filter((s) => !submittedIds.has(s._id.toString()))
    .map((s) => ({
      student: s,
      status: new Date(assignment.deadline) < new Date() ? 'late' : 'pending',
      file: null,
      marks: null,
      feedback: null,
      submittedAt: null,
    }));

  res.json({ success: true, data: [...submissions, ...notSubmitted] });
});

// @desc    Submit (or resubmit) an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'students');
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  const isEnrolled = assignment.course.students.some((id) => id.toString() === req.user._id.toString());
  if (!isEnrolled || assignment.status !== 'published') {
    res.status(403);
    throw new Error('You cannot submit to this assignment');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('A file is required to submit');
  }

  const isLate = new Date() > new Date(assignment.deadline);

  // If a submission already exists, replace the file (resubmission)
  // rather than creating a second row — enforced by the unique index too.
  let submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (submission) {
    if (submission.file?.publicId) {
      await cloudinary.uploader.destroy(submission.file.publicId, { resource_type: 'auto' }).catch(() => {});
    }
    submission.file = { url: req.file.path, publicId: req.file.filename, originalName: req.file.originalname };
    submission.submittedAt = new Date();
    submission.isLate = isLate;
    submission.status = isLate ? 'late' : 'submitted';
    submission.marks = null;
    submission.feedback = '';
  } else {
    submission = new Submission({
      assignment: assignment._id,
      student: req.user._id,
      file: { url: req.file.path, publicId: req.file.filename, originalName: req.file.originalname },
      isLate,
      status: isLate ? 'late' : 'submitted',
    });
  }

  await submission.save();
  res.status(201).json({ success: true, data: submission });
});

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private/Teacher (owner) or Admin
const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await Submission.findById(req.params.id).populate('assignment');
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }
  assertOwnsAssignment(submission.assignment, req.user, res);

  if (marks === undefined || marks < 0 || marks > submission.assignment.maxMarks) {
    res.status(400);
    throw new Error(`Marks must be between 0 and ${submission.assignment.maxMarks}`);
  }

  submission.marks = marks;
  submission.feedback = feedback || '';
  submission.status = 'graded';
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();
  await submission.save();

  await notifyUsers([submission.student], {
    type: 'assignment_graded',
    title: 'Assignment graded',
    message: `Your submission for "${submission.assignment.title}" has been graded: ${marks}/${submission.assignment.maxMarks}.`,
    link: `assignments/${submission.assignment._id}`,
  });

  res.json({ success: true, data: submission });
});

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  submitAssignment,
  gradeSubmission,
};
