const Order = require('../models/Order');

// Middleware to verify if user has access to the order
exports.verifyOrderAccess = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    
    // Find the order
    const order = await Order.findById(orderId);
    
    // Check if order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is either the client or the freelancer
    const isClient = order.clientId.toString() === userId.toString();
    const isFreelancer = order.freelancerId.toString() === userId.toString();
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ 
        message: 'Access denied: You do not have permission to access this order' 
      });
    }
    
    // Attach order and user role to request for use in controller
    req.order = order;
    req.isClient = isClient;
    req.isFreelancer = isFreelancer;
    
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware to verify if order is in specific status
exports.verifyOrderStatus = (allowedStatuses) => {
  return (req, res, next) => {
    // Order should be attached by previous middleware
    const order = req.order;
    
    if (!order) {
      return res.status(500).json({ 
        message: 'Server error: Order not found in request' 
      });
    }
    
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Operation not allowed for orders in ${order.status} status. Allowed statuses: ${allowedStatuses.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware to verify if user is the client
exports.verifyClient = (req, res, next) => {
  if (!req.isClient) {
    return res.status(403).json({ 
      message: 'Access denied: Only clients can perform this action' 
    });
  }
  
  next();
};

// Middleware to verify if user is the freelancer
exports.verifyFreelancer = (req, res, next) => {
  if (!req.isFreelancer) {
    return res.status(403).json({ 
      message: 'Access denied: Only freelancers can perform this action' 
    });
  }
  
  next();
};

// Middleware to check milestone ownership and status
exports.verifyMilestone = (allowedStatuses) => {
  return (req, res, next) => {
    const { milestoneId } = req.params;
    const order = req.order;
    
    // Find milestone by ID
    const milestone = order.milestones.find(
      m => m._id.toString() === milestoneId
    );
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Check milestone status if statuses are provided
    if (allowedStatuses && !allowedStatuses.includes(milestone.status)) {
      return res.status(400).json({ 
        message: `Operation not allowed for milestones in ${milestone.status} status. Allowed statuses: ${allowedStatuses.join(', ')}` 
      });
    }
    
    // Attach milestone to request
    req.milestone = milestone;
    next();
  };
};

module.exports = exports;