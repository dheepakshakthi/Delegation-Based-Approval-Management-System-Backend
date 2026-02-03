const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUsersByRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get users by role (for dropdowns)
router.get('/role/:role', getUsersByRole);

// Admin only routes
router.get('/', authorize('Admin'), getUsers);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

// Get single user (accessible to all authenticated users)
router.get('/:id', getUser);

module.exports = router;
