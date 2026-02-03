const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
  getPendingRequests,
  getMyRequests
} = require('../controllers/requestController');
const { getComments, addComment } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createRequestValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('requestType')
    .isIn(['Leave', 'Purchase', 'Budget', 'Project', 'Policy', 'Other'])
    .withMessage('Invalid request type'),
  body('approver').notEmpty().withMessage('Approver is required'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority')
];

const updateRequestValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty')
];

const rejectValidation = [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
];

const commentValidation = [
  body('comment').trim().notEmpty().withMessage('Comment is required')
];

// Special routes
router.get('/pending', getPendingRequests);
router.get('/my-requests', getMyRequests);

// Request routes
router.route('/')
  .get(getRequests)
  .post(createRequestValidation, validate, createRequest);

router.route('/:id')
  .get(getRequest)
  .put(updateRequestValidation, validate, updateRequest)
  .delete(deleteRequest);

// Approval actions
router.put('/:id/approve', authorize('Approver', 'Admin'), approveRequest);
router.put('/:id/reject', authorize('Approver', 'Admin'), rejectValidation, validate, rejectRequest);

// Comment routes
router.route('/:requestId/comments')
  .get(getComments)
  .post(commentValidation, validate, addComment);

module.exports = router;
