const mongoose = require('mongoose');

// One row per (recipient, event) — simple and indexable, rather than
// a single "event" document with a recipients array, which would make
// "mark this one as read for this one user" awkward. Read/unread is
// therefore just a boolean on each recipient's own row.
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'assignment_new',
        'assignment_graded',
        'test_new',
        'announcement_new',
        'result_published',
        'material_new',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Frontend route to send the user to when they click the
    // notification — e.g. "/student/assignments/<id>".
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
