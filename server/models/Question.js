const mongoose = require('mongoose');

// Kept as its own collection (rather than embedded in Test) so
// questions can be added/edited/deleted independently without
// rewriting the whole Test document each time — matters once a test
// has dozens of questions being edited one at a time.
const questionSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    text: { type: String, required: [true, 'Question text is required'], trim: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: 'A question needs between 2 and 6 options',
      },
      required: true,
    },
    // Index into `options` — kept server-side only and never sent to
    // students before they submit (see testController.getTestForAttempt).
    correctOptionIndex: { type: Number, required: true, min: 0 },
    marks: { type: Number, required: true, default: 1, min: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ test: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
