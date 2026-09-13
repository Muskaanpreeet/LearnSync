const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const User = require('../models/User');
const { notifyUsers } = require('../utils/notify');

// @desc    List announcements, scoped to what the requester should
//          actually see:
//          - Admin: everything (can still filter via query params).
//          - Teacher: their own (any status, so drafts are manageable)
//            plus published announcements for courses they teach or
//            platform-wide notices aimed at teachers/everyone.
//          - Student: published announcements for enrolled courses,
//            plus platform-wide notices aimed at students/everyone.
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  const { course, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  let visibility = {};

  if (req.user.role === 'admin') {
    visibility = course ? { course } : {};
  } else if (req.user.role === 'teacher') {
    const ownCourses = await Course.find({ teacher: req.user._id }).select('_id');
    const ownIds = ownCourses.map((c) => c._id);
    visibility = {
      $or: [
        { createdBy: req.user._id },
        { status: 'published', course: { $in: ownIds } },
        { status: 'published', course: null, audience: { $in: ['everyone', 'teachers'] } },
      ],
    };
  } else {
    const enrolledCourses = await Course.find({ students: req.user._id }).select('_id');
    const enrolledIds = enrolledCourses.map((c) => c._id);
    visibility = {
      $or: [
        { status: 'published', course: { $in: enrolledIds } },
        { status: 'published', course: null, audience: { $in: ['everyone', 'students'] } },
      ],
    };
  }

  const query = course && req.user.role !== 'admin' ? { $and: [visibility, { course }] } : visibility;

  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .populate('course', 'name code')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Announcement.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: announcements,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Create an announcement. Admin may post platform-wide
//          (audience: everyone/students/teachers) or course-specific.
//          A teacher may only post course-specific announcements for a
//          course they teach — "authorized teachers" per the spec.
// @route   POST /api/announcements
// @access  Private/Teacher or Admin
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, audience, course, status } = req.body;
  if (!title || !content) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  if (req.user.role === 'teacher') {
    if (!course) {
      res.status(403);
      throw new Error('Teachers may only post announcements for a specific course they teach');
    }
    const courseDoc = await Course.findById(course);
    if (!courseDoc || !courseDoc.teacher || courseDoc.teacher.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not assigned to this course');
    }
  }

  const announcement = await Announcement.create({
    title,
    content,
    audience: course ? 'everyone' : audience || 'everyone', // audience is ignored when course-specific
    course: course || null,
    createdBy: req.user._id,
    status: status === 'draft' ? 'draft' : 'published',
  });

  // Resolve the actual recipient list for a published announcement:
  // course-specific goes to that course's roster (+ teacher, if an
  // admin posted it); platform-wide goes to everyone matching audience.
  if (announcement.status === 'published') {
    let recipientIds = [];
    if (announcement.course) {
      const courseDoc = await Course.findById(announcement.course).select('students teacher');
      recipientIds = [...courseDoc.students, ...(courseDoc.teacher ? [courseDoc.teacher] : [])].filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      const roleFilter = announcement.audience === 'everyone' ? { role: { $in: ['student', 'teacher'] } } : { role: announcement.audience.slice(0, -1) };
      const users = await User.find(roleFilter).select('_id');
      recipientIds = users.map((u) => u._id);
    }
    await notifyUsers(recipientIds, {
      type: 'announcement_new',
      title: 'New announcement',
      message: title,
      link: 'announcements',
    });
  }

  res.status(201).json({ success: true, data: announcement });
});

// @desc    Update an announcement (including publish/unpublish)
// @route   PUT /api/announcements/:id
// @access  Private/Owner or Admin
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You did not create this announcement');
  }

  const { title, content, audience, status } = req.body;
  if (title !== undefined) announcement.title = title;
  if (content !== undefined) announcement.content = content;
  // Audience is only meaningful for platform-wide (course: null) announcements.
  if (audience !== undefined && !announcement.course) announcement.audience = audience;
  if (status !== undefined) announcement.status = status;

  await announcement.save();
  res.json({ success: true, data: announcement });
});

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Owner or Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  if (req.user.role !== 'admin' && announcement.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You did not create this announcement');
  }
  await announcement.deleteOne();
  res.json({ success: true, message: 'Announcement deleted' });
});

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
