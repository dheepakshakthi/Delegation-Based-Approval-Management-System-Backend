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

// Get users by role (for dropdowns) - needed for creating requests/delegations
router.get('/role/:role', authorize('Requester', 'Approver', 'Admin'), getUsersByRole);

// Admin only routes
router.get('/', authorize('Admin'), getUsers);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

// Get single user - users can view their own profile, admins can view any
router.get('/:id', getUser);

module.exports = router;
