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

// Special routes
router.get('/active', getActiveDelegations);
router.get('/my-delegations', getMyDelegations);
router.get('/to-me', getDelegationsToMe);

// CRUD routes
router.route('/')
  .get(getDelegations)
  .post(authorize('Approver', 'Admin'), createDelegationValidation, validate, createDelegation);

router.route('/:id')
  .get(getDelegation)
  .put(updateDelegationValidation, validate, updateDelegation)
  .delete(deleteDelegation);

module.exports = router;
