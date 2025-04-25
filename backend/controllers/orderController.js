const Order = require('../models/Order');
const Job = require('../models/Job');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');
const mongoose = require('mongoose');

// Helper function to check order ownership

function generateOrderId() {
  // Example: ORD-YYYYMMDD-XXXX where XXXX is a random number
  const date = new Date();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const randomStr = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  
  return `ORD-${dateStr}-${randomStr}`;
}

const checkOrderAccess = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { error: 'Order not found', status: 404 };
  }
  
  // Convert to strings for comparison
  const clientIdStr = order.clientId.toString();
  const freelancerIdStr = order.freelancerId.toString();
  const userIdStr = userId.toString();
  
  if (clientIdStr !== userIdStr && freelancerIdStr !== userIdStr) {
    return { error: 'Access denied: You do not have permission to access this order', status: 403 };
  }
  
  return { order };
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      jobId,
      clientId,
      freelancerId,
      title,
      whoPlaced,
      description,
      category,
      amount,
      currency,
      totalAmount,
      dueDate,
      deliverables,
      milestones,
      messages
    } = req.body;
    
    // Check if job exists
    const job = await Job.findById(jobId) || await Freelancer.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if freelancer exists
    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    // Check if client exists
    const client = await Client.findById(clientId || (req.user ? req.user.id : null));
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Calculate service fee (e.g., 10% of the amount) if totalAmount not provided
    const serviceFee = Math.round(amount * 0.1 * 100) / 100;
    const finalTotalAmount = totalAmount || (amount + serviceFee);
    
    // Process messages if provided
    const processedMessages = [];
    if (messages && messages.length > 0) {
      messages.forEach(message => {
        processedMessages.push({
          ...message,
          sentAt: message.sentAt || new Date(),
          isRead: message.isRead !== undefined ? message.isRead : false
        });
      });
    }
    
    // Create new order
    const orderId = generateOrderId();
    const order = new Order({
      orderId,
      jobId,
      whoPlaced,
      clientId: clientId || (req.user ? req.user.id : null), // Use clientId from body or fall back to req.user.id
      freelancerId,
      title,
      description,
      category: category || (job ? job.category : null),
      amount,
      serviceFee,
      totalAmount: finalTotalAmount,
      currency: currency || 'USD',
      dueDate: new Date(dueDate),
      deliverables: deliverables || [],
      milestones: milestones || [],
      messages: processedMessages,
      status: 'created'
    });
    
    await order.save();
    
    // Update job status to in-progress
    if (job) {
      job.status = 'in-progress';
      await job.save();
    }
    
    // Add order reference to freelancer's profile
    await Freelancer.findByIdAndUpdate(
      freelancerId || (req.user ? req.user.id : null),
      {
        $push: { orders: order._id }
      }
    );
    
    // Add order reference to client's profile
    await Client.findByIdAndUpdate(
      clientId || (req.user ? req.user.id : null),
      {
        $push: { orders: order._id }
      }
    );
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all orders (with filtering)
exports.getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Build query object based on role (client or freelancer)
    const query = {
      $or: [
        { clientId: userId },
        { freelancerId: userId }
      ]
    };
    
    // Optional status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Optional date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Optional search by title
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
    // Fetch orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('freelancerId', 'name profilePhoto')
      .populate('clientId', 'name');
    
    res.status(200).json({
      orders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific order by ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
    .populate('clientId')
    .populate('freelancerId')
    .populate('jobId')
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, {
      new: true, // return the updated document
      runValidators: true, // ensures schema validations
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Check if order can be canceled
    if (!['created', 'in-progress'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be canceled in its current state' 
      });
    }
    
    // Update order status and add cancellation info
    order.status = 'canceled';
    order.cancellationInfo = {
      canceledBy: req.user.id,
      canceledByModel: req.user.id.toString() === order.clientId.toString() ? 'Client' : 'Freelancer',
      reason: req.body.reason || 'No reason provided',
      refundAmount: req.body.refundAmount || 0,
      canceledAt: new Date()
    };
    
    await order.save();
    
    // Update job status
    await Job.findByIdAndUpdate(
      order.jobId,
      { status: 'open' }
    );
    
    // Update the order reference in freelancer's profile
    await Freelancer.updateOne(
      { _id: order.freelancerId, "orders.id": order.orderId },
      { $set: { "orders.$.status": "canceled" } }
    );
    
    res.status(200).json({ 
      message: 'Order canceled successfully',
      order 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Complete order
exports.completeOrder = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Only clients can mark orders as complete
    if (req.user.id.toString() !== order.clientId.toString()) {
      return res.status(403).json({ 
        message: 'Only clients can mark orders as complete' 
      });
    }
    
    // Check if order is in progress
    if (order.status !== 'in-progress') {
      return res.status(400).json({ 
        message: 'Only in-progress orders can be completed' 
      });
    }
    
    // Update order status
    order.status = 'completed';
    order.completedDate = new Date();
    
    await order.save();
    
    // Update job status
    await Job.findByIdAndUpdate(
      order.jobId,
      { status: 'completed' }
    );
    
    // Update the order reference in freelancer's profile
    await Freelancer.updateOne(
      { _id: order.freelancerId, "orders.id": order.orderId },
      { 
        $set: { "orders.$.status": "completed" },
        $inc: { jobsCompleted: 1 }
      }
    );
    
    res.status(200).json({ 
      message: 'Order completed successfully',
      order 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add milestone to order
exports.addMilestone = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    const { title, description, amount, dueDate, deliverables } = req.body;
    
    // Create new milestone
    const milestone = {
      title,
      description,
      amount,
      dueDate: new Date(dueDate),
      deliverables: deliverables || []
    };
    
    // Add milestone to order
    order.milestones.push(milestone);
    await order.save();
    
    res.status(201).json({ 
      message: 'Milestone added successfully',
      milestone: order.milestones[order.milestones.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update milestone status
exports.updateMilestone = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Find milestone by ID
    const milestoneIndex = order.milestones.findIndex(
      m => m._id.toString() === req.params.milestoneId
    );
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    const { status: newStatus, submittedWork, feedback } = req.body;
    const milestone = order.milestones[milestoneIndex];
    
    // Validate status transition
    const validTransitions = {
      pending: ['in-progress'],
      'in-progress': ['submitted'],
      submitted: ['approved', 'rejected'],
      rejected: ['in-progress', 'submitted']
    };
    
    if (newStatus && !validTransitions[milestone.status]?.includes(newStatus)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${milestone.status} to ${newStatus}` 
      });
    }
    
    // Update milestone
    if (newStatus) {
      milestone.status = newStatus;
    }
    
    if (submittedWork) {
      milestone.submittedWork = submittedWork;
    }
    
    if (feedback) {
      milestone.feedback = feedback;
    }
    
    // If approved, set completedAt date
    if (newStatus === 'approved') {
      milestone.completedAt = new Date();
    }
    
    // Save the updated order
    await order.save();
    
    res.status(200).json({ 
      message: 'Milestone updated successfully',
      milestone: order.milestones[milestoneIndex]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Request revision
exports.requestRevision = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Check if order is in a state that allows revisions
    if (!['in-progress', 'under-review'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Revisions can only be requested for in-progress or under-review orders' 
      });
    }
    
    // Check if max revisions limit has been reached
    const pendingRevisions = order.revisions.filter(r => r.status !== 'completed').length;
    const completedRevisions = order.revisions.filter(r => r.status === 'completed').length;
    
    if (completedRevisions >= order.maxRevisions) {
      return res.status(400).json({ 
        message: `Maximum revisions (${order.maxRevisions}) already used` 
      });
    }
    
    if (pendingRevisions > 0) {
      return res.status(400).json({ 
        message: 'There is already a pending revision request' 
      });
    }
    
    const { description } = req.body;
    
    // Determine if client or freelancer is requesting the revision
    const requestedBy = req.user.id;
    const requestedByModel = req.user.id.toString() === order.clientId.toString() ? 'Client' : 'Freelancer';
    
    // Create new revision request
    const revision = {
      requestedBy,
      requestedByModel,
      description,
      requestedAt: new Date(),
      status: 'pending'
    };
    
    // Add revision to order
    order.revisions.push(revision);
    
    // If client is requesting revision, update order status
    if (requestedByModel === 'Client' && order.status === 'under-review') {
      order.status = 'in-progress';
    }
    
    await order.save();
    
    res.status(201).json({ 
      message: 'Revision requested successfully',
      revision: order.revisions[order.revisions.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Complete revision
exports.completeRevision = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Find revision by ID
    const revisionIndex = order.revisions.findIndex(
      r => r._id.toString() === req.params.revisionId
    );
    
    if (revisionIndex === -1) {
      return res.status(404).json({ message: 'Revision not found' });
    }
    
    const revision = order.revisions[revisionIndex];
    
    // Only the non-requester can complete a revision
    const isClient = req.user.id.toString() === order.clientId.toString();
    const isRequester = revision.requestedBy.toString() === req.user.id.toString();
    
    if (isRequester) {
      return res.status(403).json({ 
        message: 'Only the non-requesting party can complete a revision' 
      });
    }
    
    // Update revision status
    revision.status = 'completed';
    revision.completedAt = new Date();
    
    // If freelancer completed client's revision, update order status
    if (!isClient) {
      order.status = 'under-review';
    }
    
    await order.save();
    
    res.status(200).json({ 
      message: 'Revision completed successfully',
      revision: order.revisions[revisionIndex]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add message to order
exports.addMessage = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    const { content, attachments } = req.body;
    
    // Determine if client or freelancer is sending the message
    const sender = req.user.id;
    const senderModel = req.user.id.toString() === order.clientId.toString() ? 'Client' : 'Freelancer';
    
    // Create new message
    const message = {
      sender,
      senderModel,
      content,
      sentAt: new Date(),
      attachments: attachments || [],
      isRead: false
    };
    
    // Add message to order
    order.messages.push(message);
    await order.save();
    
    res.status(201).json({ 
      message: 'Message sent successfully',
      orderMessage: order.messages[order.messages.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    const userId = req.user.id.toString();
    const isClient = userId === order.clientId.toString();
    const counterpartRole = isClient ? 'Freelancer' : 'Client';
    
    // Mark messages from the other party as read
    order.messages.forEach(message => {
      if (message.senderModel === counterpartRole && !message.isRead) {
        message.isRead = true;
      }
    });
    
    await order.save();
    
    res.status(200).json({ 
      message: 'Messages marked as read' 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create dispute
exports.createDispute = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Check if there's already an open dispute
    const openDispute = order.disputes.find(d => d.status === 'open' || d.status === 'under-review');
    if (openDispute) {
      return res.status(400).json({ 
        message: 'There is already an open dispute for this order' 
      });
    }
    
    const { reason, description } = req.body;
    
    // Determine if client or freelancer is raising the dispute
    const raisedBy = req.user.id;
    const raisedByModel = req.user.id.toString() === order.clientId.toString() ? 'Client' : 'Freelancer';
    
    // Create new dispute
    const dispute = {
      raisedBy,
      raisedByModel,
      reason,
      description,
      status: 'open',
      createdAt: new Date()
    };
    
    // Add dispute to order and update order status
    order.disputes.push(dispute);
    order.status = 'disputed';
    
    await order.save();
    
    res.status(201).json({ 
      message: 'Dispute created successfully',
      dispute: order.disputes[order.disputes.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Resolve dispute
exports.resolveDispute = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Find dispute by ID
    const disputeIndex = order.disputes.findIndex(
      d => d._id.toString() === req.params.disputeId
    );
    
    if (disputeIndex === -1) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    const dispute = order.disputes[disputeIndex];
    
    // Check if dispute is open or under review
    if (!['open', 'under-review'].includes(dispute.status)) {
      return res.status(400).json({ 
        message: 'Only open or under-review disputes can be resolved' 
      });
    }
    
    const { resolution, newOrderStatus } = req.body;
    
    // Update dispute
    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedAt = new Date();
    
    // Update order status if provided
    if (newOrderStatus && ['in-progress', 'completed', 'canceled'].includes(newOrderStatus)) {
      order.status = newOrderStatus;
      
      // If order is completed, set completed date
      if (newOrderStatus === 'completed') {
        order.completedDate = new Date();
      }
      
      // If order is canceled, add cancellation info
      if (newOrderStatus === 'canceled') {
        order.cancellationInfo = {
          canceledBy: req.user.id,
          canceledByModel: req.user.id.toString() === order.clientId.toString() ? 'Client' : 'Freelancer',
          reason: 'Canceled due to dispute resolution',
          canceledAt: new Date()
        };
      }
    }
    
    await order.save();
    
    res.status(200).json({ 
      message: 'Dispute resolved successfully',
      dispute: order.disputes[disputeIndex]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add review to order
exports.addReview = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Only completed orders can be reviewed' 
      });
    }
    
    const { rating, comment } = req.body;
    
    // Determine if client or freelancer is adding the review
    const isClient = req.user.id.toString() === order.clientId.toString();
    
    // Check if this user has already left a review
    if ((isClient && order.clientReview) || (!isClient && order.freelancerReview)) {
      return res.status(400).json({ 
        message: 'You have already reviewed this order' 
      });
    }
    
    // Create review object
    const review = {
      rating,
      comment,
      createdAt: new Date()
    };
    
    // Add review to appropriate field
    if (isClient) {
      order.clientReview = review;
      
      // Add review to freelancer's profile
      await Freelancer.findByIdAndUpdate(
        order.freelancerId,
        {
          $push: {
            reviews: {
              clientName: 'Client', // You may want to populate this with actual client name
              rating,
              date: new Date().toISOString().split('T')[0],
              comment
            }
          }
        }
      );
      
      // Update freelancer's ratings
      const freelancer = await Freelancer.findById(order.freelancerId);
      const totalRatings = freelancer.reviews.length;
      const ratingSum = freelancer.reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = parseFloat((ratingSum / totalRatings).toFixed(1));
      
      // Update ratings breakdown
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      freelancer.reviews.forEach(r => {
        breakdown[r.rating]++;
      });
      
      freelancer.ratings = {
        average: averageRating,
        breakdown,
        total: totalRatings
      };
      
      await freelancer.save();
    } else {
      order.freelancerReview = review;
      // If needed, you could also update client's ratings here
    }
    
    await order.save();
    
    res.status(201).json({ 
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    const { order, error, status } = await checkOrderAccess(req.params.id, req.user.id);
    
    if (error) {
      return res.status(status).json({ message: error });
    }
    
    // Note: In a real implementation, you would process the file upload
    // and store it somewhere (e.g., AWS S3, local filesystem)
    // For this example, we'll just simulate adding the file path
    
    const filePath = req.body.filePath || `uploads/order-${order._id}-${Date.now()}`;
    
    // Add attachment to order
    order.attachments.push(filePath);
    await order.save();
    
    res.status(201).json({ 
      message: 'Attachment uploaded successfully',
      filePath
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};