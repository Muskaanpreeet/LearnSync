const mongoose = require('mongoose');

// A Submission only exists once a student actually submits — there's
// no "pending" row created in advance for every enrolled student.
// "Pending" (in the frontend) simply means: no Submission document
// exists yet and the deadline hasn't passed. This avoids creating and
// maintaining thousands of empty placeholder rows.
const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      originalName: { type: String, default: '' },
    },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false }, // computed once, at submission time, against the assignment's deadline
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded'],
      default: 'submitted',
    },
    marks: { type: Number, min: 0, default: null },
    feedback: { type: String, trim: true, maxlength: 2000 },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

// One submission per student per assignment — resubmitting overwrites
// the existing row rather than creating duplicates.
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
