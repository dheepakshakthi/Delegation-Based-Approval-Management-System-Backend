const Delegation = require('../models/Delegation');
const { sendEmail } = require('../utils/email');

// @desc    Get all delegations
// @route   GET /api/delegations
// @access  Private
exports.getDelegations = async (req, res, next) => {
  try {
    let query = {};

    // Filter based on user role
    if (req.user.role !== 'Admin') {
      // Users can see delegations where they are delegator or delegate
      query.$or = [
        { delegator: req.user._id },
        { delegate: req.user._id }
      ];
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const delegations = await Delegation.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: delegations.length,
      data: delegations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single delegation
// @route   GET /api/delegations/:id
// @access  Private
exports.getDelegation = async (req, res, next) => {
  try {
    const delegation = await Delegation.findById(req.params.id);

    if (!delegation) {
      return res.status(404).json({
        success: false,
        message: 'Delegation not found'
      });
    }

    // Check authorization
    const isDelegator = delegation.delegator._id.toString() === req.user._id.toString();
    const isDelegate = delegation.delegate._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isDelegator && !isDelegate && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delegation'
      });
    }

    res.status(200).json({
      success: true,
      data: delegation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new delegation
// @route   POST /api/delegations
// @access  Private/Approver
exports.createDelegation = async (req, res, next) => {
  try {
    // Only approvers can create delegations
    if (req.user.role !== 'Approver' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only approvers can create delegations'
      });
    }

    // Set delegator to current user
    req.body.delegator = req.user._id;

    // Check if delegating to self
    if (req.body.delegate === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delegate to yourself'
      });
    }

    // Check for overlapping delegations
    const newDelegation = new Delegation(req.body);
    const hasOverlap = await newDelegation.hasOverlap(req.user._id);

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active delegation for this time period'
      });
    }

    const delegation = await Delegation.create(req.body);

    // Send email notification to delegate
    try {
      await sendEmail({
        to: delegation.delegate.email,
        subject: 'New Delegation Assignment',
        text: `${req.user.name} has delegated their approval authority to you.\n\nPeriod: ${delegation.startDate.toDateString()} to ${delegation.endDate.toDateString()}\nReason: ${delegation.reason}\n\nYou can now approve requests on their behalf during this period.`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Delegation created successfully',
      data: delegation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update delegation
// @route   PUT /api/delegations/:id
// @access  Private
exports.updateDelegation = async (req, res, next) => {
  try {
    let delegation = await Delegation.findById(req.params.id);

    if (!delegation) {
      return res.status(404).json({
        success: false,
        message: 'Delegation not found'
      });
    }

    // Check if user is the delegator or admin
    if (delegation.delegator._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delegation'
      });
    }

    // Cannot update if already expired
    if (!delegation.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update inactive delegation'
      });
    }

    delegation = await Delegation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Delegation updated successfully',
      data: delegation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel/Delete delegation
// @route   DELETE /api/delegations/:id
// @access  Private
exports.deleteDelegation = async (req, res, next) => {
  try {
    const delegation = await Delegation.findById(req.params.id);

    if (!delegation) {
      return res.status(404).json({
        success: false,
        message: 'Delegation not found'
      });
    }

    // Check if user is the delegator or admin
    if (delegation.delegator._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this delegation'
      });
    }

    // Set delegation as inactive instead of deleting
    delegation.isActive = false;
    await delegation.save();

    // Send email notification to delegate
    try {
      await sendEmail({
        to: delegation.delegate.email,
        subject: 'Delegation Cancelled',
        text: `The delegation from ${delegation.delegator.name} has been cancelled.\n\nYou no longer have approval authority on their behalf.`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Delegation cancelled successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active delegations
// @route   GET /api/delegations/active
// @access  Private
exports.getActiveDelegations = async (req, res, next) => {
  try {
    const now = new Date();
    let query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Filter based on user role
    if (req.user.role !== 'Admin') {
      query.$or = [
        { delegator: req.user._id },
        { delegate: req.user._id }
      ];
    }

    const delegations = await Delegation.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: delegations.length,
      data: delegations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my delegations (as delegator)
// @route   GET /api/delegations/my-delegations
// @access  Private
exports.getMyDelegations = async (req, res, next) => {
  try {
    const delegations = await Delegation.find({ 
      delegator: req.user._id 
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: delegations.length,
      data: delegations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get delegations to me (as delegate)
// @route   GET /api/delegations/to-me
// @access  Private
exports.getDelegationsToMe = async (req, res, next) => {
  try {
    const delegations = await Delegation.find({ 
      delegate: req.user._id 
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: delegations.length,
      data: delegations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
