const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    duration: { type: Number, required: [true, 'Duration in minutes is required'], min: 1 },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    // Draft tests are invisible to students, same convention as Assignment.status.
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    // Whether a student sees their score the moment they submit, or
    // only after `endDate` has passed for everyone (e.g. so early
    // finishers can't leak answers to classmates still taking it).
    resultVisibility: { type: String, enum: ['immediate', 'after_end'], default: 'immediate' },
  },
  { timestamps: true }
);

testSchema.index({ course: 1, status: 1 });
testSchema.index({ teacher: 1 });

// Virtual — total marks is the sum of its questions' marks, computed
// on populate rather than stored/duplicated on the Test document
// itself (which would need to stay in sync every time a question's
// marks changed).
testSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'test',
});
testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Test', testSchema);
