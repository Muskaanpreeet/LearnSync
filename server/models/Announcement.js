const mongoose = require('mongoose');

// Two ways an announcement can be scoped:
//  1. `course` is set  → course-specific, visible to that course's
//     teacher + enrolled students, regardless of `audience`.
//  2. `course` is null → `audience` decides who sees it (everyone,
//     just students, or just teachers) — a platform-wide notice.
// This lets an admin post an institution-wide notice and a teacher
// post a course-only one, both through the same model.
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    content: { type: String, required: [true, 'Content is required'], trim: true, maxlength: 3000 },
    audience: { type: String, enum: ['everyone', 'students', 'teachers'], default: 'everyone' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Draft/published mirrors Assignments/Tests/Results — a teacher or
    // admin can prepare an announcement before it goes out.
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

announcementSchema.index({ course: 1, status: 1 });
announcementSchema.index({ audience: 1, status: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
