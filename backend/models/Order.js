const mongoose = require('mongoose');

// Define payment status enum options
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  CANCELED: 'canceled'
};

// Define order status enum options
const ORDER_STATUS = {
  CREATED: 'created',
  IN_PROGRESS: 'in-progress',
  UNDER_REVIEW: 'under-review',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  DISPUTED: 'disputed'
};

// Define milestone schema to track project progress
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  dueDate: { type: Date },
  deliverables: [String],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedWork: { type: String, default: '' },
  feedback: { type: String, default: '' },
  completedAt: { type: Date }
}, { _id: true, timestamps: true });

// Define revisions schema
const revisionSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'requestedByModel'
  },
  requestedByModel: {
    type: String,
    enum: ['Client', 'Freelancer']
  },
  description: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  completedAt: { type: Date }
}, { _id: true });

// Main Order Schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
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
  // Essential details
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  
  // Financial details
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  serviceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  
  // Order status and timeline
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.CREATED
  },
  startDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  completedDate: { type: Date },
  
  // Project management
  milestones: [milestoneSchema],
  deliverables: [String],
  revisions: [revisionSchema],
  maxRevisions: { type: Number, default: 3 },
  
  // Communication and documents
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel'
    },
    senderModel: {
      type: String,
      enum: ['Client', 'Freelancer']
    },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    attachments: [String],
    isRead: { type: Boolean, default: false }
  }],
  attachments: [String],
  
  // Rating and review
  clientReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date }
  },
  freelancerReview: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date }
  },
  
  // Dispute management
  disputes: [{
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'raisedByModel'
    },
    raisedByModel: {
      type: String,
      enum: ['Client', 'Freelancer']
    },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'under-review', 'resolved', 'closed'],
      default: 'open'
    },
    resolution: { type: String },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  }],
  
  // Cancellation information
  cancellationInfo: {
    canceledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'canceledByModel'
    },
    canceledByModel: {
      type: String,
      enum: ['Client', 'Freelancer', 'Admin']
    },
    reason: { type: String },
    refundAmount: { type: Number },
    canceledAt: { type: Date }
  },
  
  // Terms and conditions
  terms: { type: String },
  
  // Admin metadata
  isArchived: { type: Boolean, default: false },
  notes: { type: String }
}, {
  timestamps: true
});

// Create indexes for better query performance
orderSchema.index({ orderId: 1 });
orderSchema.index({ clientId: 1 });
orderSchema.index({ freelancerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });

// Virtual to get the project duration in days
orderSchema.virtual('projectDuration').get(function() {
  if (!this.dueDate) return null;
  const startDate = this.startDate || this.createdAt;
  const millisPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((this.dueDate - startDate) / millisPerDay);
});

// Method to calculate the milestone progress percentage
orderSchema.methods.calculateProgress = function() {
  if (!this.milestones || this.milestones.length === 0) return 0;
  
  const completedMilestones = this.milestones.filter(
    milestone => milestone.status === 'approved'
  ).length;
  
  return Math.round((completedMilestones / this.milestones.length) * 100);
};

// Method to check if the order is overdue
orderSchema.methods.isOverdue = function() {
  if (!this.dueDate) return false;
  if (['completed', 'canceled', 'disputed'].includes(this.status)) return false;
  
  return this.dueDate < new Date();
};

// Pre-save hook to generate order ID if not provided
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    // Generate a unique order ID with ORD prefix and timestamp
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  
  // Calculate total amount if not set
  if (this.amount && !this.totalAmount) {
    this.totalAmount = this.amount + (this.serviceFee || 0);
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;