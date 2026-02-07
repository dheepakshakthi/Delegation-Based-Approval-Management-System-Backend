const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRequest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: [true, 'Please provide a comment'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Middleware to populate user information
commentSchema.pre(/^find/, function() {
  this.populate({
    path: 'user',
    select: 'name email position role'
  });
});

module.exports = mongoose.model('Comment', commentSchema);
