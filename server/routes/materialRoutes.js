const express = require('express');
const router = express.Router();
const { getMaterials, createMaterial, deleteMaterial } = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const createUploader = require('../middleware/upload');

const materialUpload = createUploader('materials', { maxSizeMB: 25 });

router.use(protect);

router
  .route('/')
  .get(getMaterials)
  .post(authorize('teacher', 'admin'), materialUpload.single('file'), createMaterial);

router.delete('/:id', authorize('teacher', 'admin'), deleteMaterial);

module.exports = router;
