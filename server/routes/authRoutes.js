const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Private (require a valid JWT)
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
