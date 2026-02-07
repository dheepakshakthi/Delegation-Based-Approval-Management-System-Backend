const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const {
  getDelegations,
  getDelegation,
  createDelegation,
  updateDelegation,
  deleteDelegation,
  getActiveDelegations,
  getMyDelegations,
  getDelegationsToMe
} = require('../controllers/delegationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createDelegationValidation = [
  body('delegate').notEmpty().withMessage('Delegate is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required')
];

const updateDelegationValidation = [
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('reason').optional().trim().notEmpty().withMessage('Reason cannot be empty')
];

// Special routes - Only Approvers and Admins can access delegations
router.get('/active', authorize('Approver', 'Admin'), getActiveDelegations);
router.get('/my-delegations', authorize('Approver', 'Admin'), getMyDelegations);
router.get('/to-me', authorize('Approver', 'Admin'), getDelegationsToMe);

// CRUD routes - Only Approvers and Admins
router.route('/')
  .get(authorize('Approver', 'Admin'), getDelegations)
  .post(authorize('Approver', 'Admin'), createDelegationValidation, validate, createDelegation);

router.route('/:id')
  .get(authorize('Approver', 'Admin'), getDelegation)
  .put(authorize('Approver', 'Admin'), updateDelegationValidation, validate, updateDelegation)
  .delete(authorize('Approver', 'Admin'), deleteDelegation);

module.exports = router;
