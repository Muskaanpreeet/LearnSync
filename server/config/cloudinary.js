const cloudinary = require('cloudinary').v2;

// Configure the Cloudinary SDK once, using credentials from .env.
// Every upload (profile pics, assignment files, study materials) goes
// through this same configured instance — see middleware/upload.js.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
