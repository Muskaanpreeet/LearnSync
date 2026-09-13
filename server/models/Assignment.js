const mongoose = require('mongoose');

// One Assignment belongs to exactly one Course and one Teacher (the
// course's teacher at creation time — kept explicit here so an
// assignment stays attributable even if the course is later
// reassigned to a different teacher).
const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 3000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: [true, 'Deadline is required'] },
    maxMarks: { type: Number, required: true, default: 100, min: 1 },
    attachment: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      originalName: { type: String, default: '' },
    },
    // Draft assignments are only visible to the teacher who owns them —
    // students only ever see `published`.
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, status: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ deadline: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
