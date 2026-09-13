const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getAnnouncements).post(authorize('teacher', 'admin'), createAnnouncement);

router.route('/:id').put(authorize('teacher', 'admin'), updateAnnouncement).delete(authorize('teacher', 'admin'), deleteAnnouncement);

module.exports = router;
