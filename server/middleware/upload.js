const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Factory so every feature that uploads files (assignments, submissions,
// study materials, profile pictures) gets its own Cloudinary folder and
// size limit, but shares the same underlying setup — one place to
// change upload behavior instead of duplicating multer config per route.
//
// `resourceType: 'auto'` lets Cloudinary store PDFs/DOCX/PPTX as raw
// files and images as images, all through the same uploader.
const createUploader = (folder, { maxSizeMB = 15 } = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `learnsync/${folder}`,
      resource_type: 'auto',
      // Keep the original filename (minus extension) so downloads look
      // sensible instead of a random Cloudinary hash.
      public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`,
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /pdf|doc|docx|ppt|pptx|jpg|jpeg|png|zip/i;
      if (allowed.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    },
  });
};

module.exports = createUploader;
