const express = require('express');
const router = express.Router();
const { getUsers, getUserById, setUserStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All user-management routes are Admin-only.
router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/status', setUserStatus);
router.delete('/:id', deleteUser);

module.exports = router;
