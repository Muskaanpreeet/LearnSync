const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      originalName: { type: String, default: '' },
      // Derived once at upload time from the original filename's
      // extension, so the frontend can show a file-type icon/filter
      // without re-parsing the URL every time.
      fileType: { type: String, default: 'other' },
    },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ course: 1 });
studyMaterialSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
