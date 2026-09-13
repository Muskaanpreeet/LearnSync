const mongoose = require('mongoose');

// One document per (course, date, student). This shape — rather than
// one document per class session with an embedded student array —
// makes "what % of classes has this student attended in this course"
// a simple count query instead of an aggregation over embedded arrays,
// which matters because attendance percentage is read far more often
// than a single day's attendance is written.
const attendanceSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Stored at midnight UTC for the given day so "same day" comparisons
    // are exact equality instead of range queries.
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One attendance row per student per course per day — re-marking the
// same day updates this row (see controller's upsert) instead of
// creating duplicates.
attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
