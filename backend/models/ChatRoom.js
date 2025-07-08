const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Freelancer',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  clientUnreadCount: {
    type: Number,
    default: 0
  },
  freelancerUnreadCount: {
    type: Number,
    default: 0
  },
  isClientActive: {
    type: Boolean,
    default: true
  },
  isFreelancerActive: {
    type: Boolean,
    default: true
  },
  // Optional: Associate with a specific job/order
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  }
}, {
  timestamps: true
});

// Ensure unique chat room per client-freelancer pair
chatRoomSchema.index({ clientId: 1, freelancerId: 1 }, { unique: true });
chatRoomSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);