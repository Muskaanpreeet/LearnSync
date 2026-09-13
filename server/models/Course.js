const mongoose = require('mongoose');

// A single Course document. Students are NOT embedded here as an
// array (that would mean rewriting a big array on every enrollment) —
// instead each User document references the courses it's connected to
// (User.enrolledCourses / User.assignedCourses), and this model keeps
// its own `teacher` reference. This two-way referencing pattern avoids
// large, frequently-mutated arrays inside a single document.
const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // a course can exist before a teacher is assigned
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Speeds up the common filters (department/semester/teacher/status)
// and the search page described in the spec.
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ name: 'text', code: 'text' }); // supports text search

// Virtual so the frontend can show "24 students" without loading the
// whole `students` array when it only needs the count.
courseSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});
courseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
