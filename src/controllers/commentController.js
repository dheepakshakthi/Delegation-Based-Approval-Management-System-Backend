const Comment = require('../models/Comment');
const ApprovalRequest = require('../models/ApprovalRequest');

// @desc    Get comments for a request
// @route   GET /api/requests/:requestId/comments
// @access  Private
exports.getComments = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const comments = await Comment.find({ request: req.params.requestId })
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to request
// @route   POST /api/requests/:requestId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const request = await ApprovalRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is authorized to comment
    const isRequester = request.requester._id.toString() === req.user._id.toString();
    const isApprover = request.approver._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isRequester && !isApprover && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this request'
      });
    }

    const comment = await Comment.create({
      request: req.params.requestId,
      user: req.user._id,
      comment: req.body.comment
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only the comment author or admin can delete
    if (comment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
