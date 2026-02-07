const mongoose = require('mongoose');

const delegationSchema = new mongoose.Schema({
  delegator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide the delegator']
  },
  delegate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide the delegate']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
    validate: {
      validator: function(value) {
        // Start date should not be in the past (allow current day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Start date cannot be in the past'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for delegation'],
    trim: true
  },
  autoExpired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
delegationSchema.index({ delegator: 1, isActive: 1 });
delegationSchema.index({ delegate: 1, isActive: 1 });
delegationSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if delegation is currently active
delegationSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

// Method to check if delegation overlaps with another
delegationSchema.methods.hasOverlap = async function(delegatorId) {
  const Delegation = mongoose.model('Delegation');
  
  const overlapping = await Delegation.findOne({
    _id: { $ne: this._id },
    delegator: delegatorId,
    isActive: true,
    $or: [
      {
        // New delegation starts during existing delegation
        startDate: { $lte: this.startDate },
        endDate: { $gte: this.startDate }
      },
      {
        // New delegation ends during existing delegation
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.endDate }
      },
      {
        // New delegation encompasses existing delegation
        startDate: { $gte: this.startDate },
        endDate: { $lte: this.endDate }
      }
    ]
  });
  
  return !!overlapping;
};

// Middleware to populate references
delegationSchema.pre(/^find/, function() {
  this.populate({
    path: 'delegator',
    select: 'name email department position role'
  }).populate({
    path: 'delegate',
    select: 'name email department position role'
  });
});

// Static method to get active delegation for a user
delegationSchema.statics.getActiveDelegation = async function(delegatorId) {
  const now = new Date();
  return this.findOne({
    delegator: delegatorId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

module.exports = mongoose.model('Delegation', delegationSchema);
