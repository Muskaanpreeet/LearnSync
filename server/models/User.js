const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// One "users" collection holds Admin, Teacher, and Student accounts.
// The `role` field is the discriminator the rest of the app checks
// (see middleware/auth.js -> authorize()). Role-specific fields are
// optional so a single flexible schema covers all three roles without
// three separate collections.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned by default on queries
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
      default: 'student',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }, // Cloudinary public_id, needed to delete/replace
    },
    phone: { type: String, trim: true },
    isActive: {
      type: Boolean,
      default: true, // Admin can deactivate accounts without deleting them
    },

    // --- Student-specific fields ---
    rollNumber: { type: String, trim: true, sparse: true, unique: true },
    department: { type: String, trim: true },
    semester: { type: Number, min: 1, max: 12 },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    // --- Teacher-specific fields ---
    designation: { type: String, trim: true }, // e.g. Assistant Professor
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

    // --- Password reset ---
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Hash the password automatically whenever it is set/changed.
// This runs on every save, but only re-hashes if `password` was modified,
// so updating a user's name doesn't re-hash an already-hashed password.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare a plaintext login attempt to the stored hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: generate a one-time reset token, store only its
// SHA-256 hash in the DB (so a leaked DB can't be used to reset
// passwords), and return the plain token to email/send to the user.
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
