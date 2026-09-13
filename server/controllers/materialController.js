const asyncHandler = require('express-async-handler');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const StudyMaterial = require('../models/StudyMaterial');
const Course = require('../models/Course');
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

// Buckets a filename's extension into a small set of categories the
// frontend uses for filtering and file-type icons.
const detectFileType = (filename = '') => {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  return 'other';
};

// @desc    List study materials. Teacher: materials for their own
//          courses. Student: materials for enrolled courses. Admin:
//          all. Supports `search`, `course`, `fileType`, pagination.
// @route   GET /api/materials
// @access  Private
const getMaterials = asyncHandler(async (req, res) => {
  const { search, course, fileType, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const query = {};
  if (course) query.course = course;
  if (fileType) query['file.fileType'] = fileType;
  if (search) query.$text = { $search: search };

  if (req.user.role === 'teacher') {
    const ownCourses = await Course.find({ teacher: req.user._id }).select('_id');
    const ownIds = ownCourses.map((c) => c._id);
    query.course = course ? course : { $in: ownIds };
  } else if (req.user.role === 'student') {
    const enrolledCourses = await Course.find({ students: req.user._id }).select('_id');
    const enrolledIds = enrolledCourses.map((c) => c._id);
    query.course = course ? course : { $in: enrolledIds };
  }

  const [materials, total] = await Promise.all([
    StudyMaterial.find(query)
      .populate('course', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    StudyMaterial.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: materials,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Upload a new study material
// @route   POST /api/materials
// @access  Private/Teacher (owner of the course) or Admin
const createMaterial = asyncHandler(async (req, res) => {
  const { title, description, course } = req.body;
  if (!title || !course) {
    res.status(400);
    throw new Error('Title and course are required');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('A file is required');
  }

  const courseDoc = await assertOwnsCourse(course, req.user, res);

  const material = await StudyMaterial.create({
    title,
    description,
    course,
    uploadedBy: req.user._id,
    file: {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      fileType: detectFileType(req.file.originalname),
    },
  });

  await notifyUsers(courseDoc.students, {
    type: 'material_new',
    title: 'New study material',
    message: `${title} was uploaded to ${courseDoc.code}.`,
    link: 'materials',
  });

  res.status(201).json({ success: true, data: material });
});

// @desc    Delete a study material (and its Cloudinary file)
// @route   DELETE /api/materials/:id
// @access  Private/Teacher (uploader) or Admin
const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);
  if (!material) {
    res.status(404);
    throw new Error('Study material not found');
  }
  if (req.user.role === 'teacher' && material.uploadedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You did not upload this material');
  }

  if (material.file?.publicId) {
    await cloudinary.uploader.destroy(material.file.publicId, { resource_type: 'auto' }).catch(() => {});
  }
  await material.deleteOne();

  res.json({ success: true, message: 'Study material deleted' });
});

module.exports = { getMaterials, createMaterial, deleteMaterial };
