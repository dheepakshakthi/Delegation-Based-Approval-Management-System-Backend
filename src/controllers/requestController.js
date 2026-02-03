const ApprovalRequest = require('../models/ApprovalRequest');
const Delegation = require('../models/Delegation');
const { sendEmail } = require('../utils/email');

// @desc    Get all approval requests
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res, next) => {
  try {
    const { status, priority, requestType, search } = req.query;
    let query = {};

    // Build query based on user role
    if (req.user.role === 'Requester') {
      // Requesters can only see their own requests
      query.requester = req.user._id;
    } else if (req.user.role === 'Approver') {
      // Approvers see requests assigned to them or delegated to them
      const activeDelegations = await Delegation.find({
        delegate: req.user._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      }).select('delegator');

      const delegatorIds = activeDelegations.map(d => d.delegator._id);
      
      query.$or = [
        { approver: req.user._id },
        { approver: { $in: delegatorIds } }
      ];
    }
    // Admins can see all requests (no additional filter)

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (requestType) query.requestType = requestType;
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const requests = await ApprovalRequest.find(query)
      .populate('comments')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single approval request
// @route   GET /api/requests/:id
// @access  Private
exports.getRequest = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)
      .populate('comments');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check authorization
    const isRequester = request.requester._id.toString() === req.user._id.toString();
    const isApprover = request.approver._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isRequester && !isApprover && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new approval request
// @route   POST /api/requests
// @access  Private
exports.createRequest = async (req, res, next) => {
  try {
    // Add requester to req.body
    req.body.requester = req.user._id;

    const request = await ApprovalRequest.create(req.body);

    // Send email notification to approver
    try {
      const approver = request.approver;
      await sendEmail({
        to: approver.email,
        subject: 'New Approval Request',
        text: `You have a new approval request from ${req.user.name}.\n\nTitle: ${request.title}\nPriority: ${request.priority}\n\nPlease log in to review.`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update approval request
// @route   PUT /api/requests/:id
// @access  Private
exports.updateRequest = async (req, res, next) => {
  try {
    let request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the requester
    if (request.requester._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this request'
      });
    }

    // Can't update if already approved or rejected
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update request with status: ${request.status}`
      });
    }

    request = await ApprovalRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete/Cancel approval request
// @route   DELETE /api/requests/:id
// @access  Private
exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is the requester or admin
    if (request.requester._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    // Can only cancel pending requests
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status: ${request.status}`
      });
    }

    request.status = 'Cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request cancelled successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve request
// @route   PUT /api/requests/:id/approve
// @access  Private/Approver
exports.approveRequest = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}`
      });
    }

    // Check if user is authorized to approve
    const isDirectApprover = request.approver._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    
    // Check for delegation
    let isDelegateApprover = false;
    if (!isDirectApprover && !isAdmin) {
      const activeDelegation = await Delegation.getActiveDelegation(request.approver._id);
      if (activeDelegation && activeDelegation.delegate._id.toString() === req.user._id.toString()) {
        isDelegateApprover = true;
        request.actualApprover = req.user._id;
      }
    }

    if (!isDirectApprover && !isAdmin && !isDelegateApprover) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this request'
      });
    }

    request.status = 'Approved';
    request.reviewedAt = Date.now();
    if (!request.actualApprover) {
      request.actualApprover = req.user._id;
    }
    await request.save();

    // Send email notification to requester
    try {
      await sendEmail({
        to: request.requester.email,
        subject: 'Request Approved',
        text: `Your request "${request.title}" has been approved by ${req.user.name}.`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Request approved successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject request
// @route   PUT /api/requests/:id/reject
// @access  Private/Approver
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status.toLowerCase()}`
      });
    }

    // Check if user is authorized to reject
    const isDirectApprover = request.approver._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    
    // Check for delegation
    let isDelegateApprover = false;
    if (!isDirectApprover && !isAdmin) {
      const activeDelegation = await Delegation.getActiveDelegation(request.approver._id);
      if (activeDelegation && activeDelegation.delegate._id.toString() === req.user._id.toString()) {
        isDelegateApprover = true;
        request.actualApprover = req.user._id;
      }
    }

    if (!isDirectApprover && !isAdmin && !isDelegateApprover) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request'
      });
    }

    request.status = 'Rejected';
    request.rejectionReason = req.body.reason || 'No reason provided';
    request.reviewedAt = Date.now();
    if (!request.actualApprover) {
      request.actualApprover = req.user._id;
    }
    await request.save();

    // Send email notification to requester
    try {
      await sendEmail({
        to: request.requester.email,
        subject: 'Request Rejected',
        text: `Your request "${request.title}" has been rejected by ${req.user.name}.\n\nReason: ${request.rejectionReason}`
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending requests for current user
// @route   GET /api/requests/pending
// @access  Private
exports.getPendingRequests = async (req, res, next) => {
  try {
    let query = { status: 'Pending' };

    if (req.user.role === 'Approver') {
      // Get requests assigned to this approver or delegated to them
      const activeDelegations = await Delegation.find({
        delegate: req.user._id,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      }).select('delegator');

      const delegatorIds = activeDelegations.map(d => d.delegator._id);
      
      query.$or = [
        { approver: req.user._id },
        { approver: { $in: delegatorIds } }
      ];
    } else if (req.user.role === 'Requester') {
      query.requester = req.user._id;
    }
    // Admin sees all pending

    const requests = await ApprovalRequest.find(query)
      .sort('-priority -createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's own requests
// @route   GET /api/requests/my-requests
// @access  Private
exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await ApprovalRequest.find({ requester: req.user._id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
