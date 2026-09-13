const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Small helper so every auth response has the same user shape and
// NEVER leaks the password hash or reset-token fields.
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  department: user.department,
  rollNumber: user.rollNumber,
  isActive: user.isActive,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// NOTE: In production you'd likely restrict role selection here (e.g.
// only Admin can create Teacher/Admin accounts) — for this project,
// self-registration is allowed for students, and the seed script
// creates the Admin/Teacher demo accounts.
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, rollNumber, department, semester, designation } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('An account with that email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'teacher' ? 'teacher' : 'student', // block self-registering as admin
    rollNumber,
    department,
    semester,
    designation,
  });

  const token = generateToken(user._id, user.role);
  res.status(201).json({ success: true, token, user: sanitizeUser(user) });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // .select('+password') because the schema hides it by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  res.json({ success: true, token, user: sanitizeUser(user) });
});

// @desc    Logout — clears the auth cookie if the cookie-based flow is used.
//          Token-based (Authorization header) logout is handled client-side
//          by discarding the stored token; this endpoint exists so both
//          flows have a consistent server call to hit.
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get the currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect() middleware
  res.json({ success: true, user: sanitizeUser(req.user) });
});

// @desc    Change password (while logged in)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Request a password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  // Always respond the same way whether or not the email exists —
  // this avoids leaking which emails are registered.
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // In a real deployment this would be emailed via a mail service
  // (e.g. Nodemailer/SendGrid). For this project, it's returned in
  // the response so it can be demoed without email infrastructure.
  res.json({
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
    resetToken, // DEV-ONLY — remove/email this instead in production
  });
});

// @desc    Reset password using the token from forgotPassword
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);
  res.json({ success: true, token, message: 'Password reset successful' });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
