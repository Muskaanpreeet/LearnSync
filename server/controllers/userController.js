const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    List users with role/search filter + pagination.
//          Used by Admin (student/teacher management pages) and also
//          by the course-creation UI to populate teacher/student pickers.
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, department, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (department) query.department = department;
  if (status) query.isActive = status === 'active';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('enrolledCourses assignedCourses', 'name code');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc    Activate/deactivate a user account
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = { getUsers, getUserById, setUserStatus, deleteUser };
