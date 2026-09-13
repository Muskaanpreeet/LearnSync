const mongoose = require('mongoose');

// Records one student's attempt at a test: their answers, when they
// started/submitted, and the auto-graded score. `answers` stores the
// selected option index per question, not the option text, so
// grading is a simple index comparison against Question.correctOptionIndex.
const testAttemptSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOptionIndex: { type: Number, default: null }, // null = left unanswered
      },
    ],
    score: { type: Number, default: null }, // filled in once submitted
    totalMarks: { type: Number, default: null },
    status: { type: String, enum: ['in-progress', 'submitted'], default: 'in-progress' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

// One attempt per student per test — starting a test the student
// already started resumes the same document instead of creating a
// second attempt, and this is also what stops a student from
// re-attempting after submitting.
testAttemptSchema.index({ test: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
