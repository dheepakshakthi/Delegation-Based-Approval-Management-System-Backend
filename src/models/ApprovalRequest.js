const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  requestType: {
    type: String,
    required: [true, 'Please provide a request type'],
    enum: ['Leave', 'Purchase', 'Budget', 'Project', 'Policy', 'Other'],
    default: 'Other'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualApprover: {
    // This field tracks who actually approved if delegation was in place
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  amount: {
    type: Number,
    min: 0
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rejectionReason: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
approvalRequestSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'request',
  justOne: false
});

// Middleware to populate references
approvalRequestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'requester',
    select: 'name email department position'
  }).populate({
    path: 'approver',
    select: 'name email department position'
  }).populate({
    path: 'actualApprover',
    select: 'name email department position'
  });
  next();
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
