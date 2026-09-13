const mongoose = require('mongoose');

// Represents one exam/assessment component's marks for one student in
// one course — e.g. "Mid-Semester Exam: 42/50". This is separate from
// Submission (assignment marks) and TestAttempt (quiz scores); Results
// covers the manually-entered marks (midterms, finals, internals) that
// don't come from an online submission or auto-graded test. The
// consolidated student performance view (see controller) combines all
// three sources.
const resultSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true }, // e.g. "Midterm Exam"
    examType: { type: String, enum: ['midterm', 'final', 'internal', 'other'], default: 'other' },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    // Draft results are only visible to the teacher — same
    // publish-before-students-see-it convention as Assignment/Test.
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

// One row per (course, student, title) — re-entering marks for the
// same exam title upserts instead of duplicating, mirroring the
// Attendance module's pattern for the same reason (bulk re-entry/edit).
resultSchema.index({ course: 1, student: 1, title: 1 }, { unique: true });
resultSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Result', resultSchema);
