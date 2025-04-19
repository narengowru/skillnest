const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const orderMiddleware = require('../middleware/orderMiddleware');

// All order routes should be protected


// Create a new order
router.post('/', orderController.createOrder);

// Get all orders (with filters)
router.get('/', orderController.getAllOrders);

// Get specific order by ID
router.get('/:id', orderController.getOrderById);

// Update order status and details
router.put('/:id', 
  
  orderController.updateOrder
);

// Cancel order
router.put('/:id/cancel', 
  
  orderController.cancelOrder
);

// Complete order
router.put('/:id/complete', 
  orderMiddleware.verifyOrderAccess, 
  orderMiddleware.verifyClient,
  orderMiddleware.verifyOrderStatus(['in-progress']), 
  orderController.completeOrder
);

// Add milestone to order
router.post('/:id/milestones', 
  orderMiddleware.verifyOrderAccess, 
  orderMiddleware.verifyOrderStatus(['created', 'in-progress']), 
  orderController.addMilestone
);

// Update milestone status
router.put('/:id/milestones/:milestoneId', 
  orderMiddleware.verifyOrderAccess,
  orderMiddleware.verifyMilestone(),
  orderController.updateMilestone
);

// Add revision request
router.post('/:id/revisions', 
  orderMiddleware.verifyOrderAccess, 
  orderMiddleware.verifyOrderStatus(['in-progress', 'under-review']), 
  orderController.requestRevision
);

// Complete revision
router.put('/:id/revisions/:revisionId', 
  orderMiddleware.verifyOrderAccess, 
  orderController.completeRevision
);

// Add message to order
router.post('/:id/messages', 
  orderMiddleware.verifyOrderAccess, 
  orderController.addMessage
);

// Mark messages as read
router.put('/:id/messages/read', 
  orderMiddleware.verifyOrderAccess, 
  orderController.markMessagesAsRead
);

// Add dispute to order
router.post('/:id/disputes', 
  orderMiddleware.verifyOrderAccess, 
  orderMiddleware.verifyOrderStatus(['created', 'in-progress', 'under-review', 'completed']), 
  orderController.createDispute
);

// Resolve dispute
router.put('/:id/disputes/:disputeId', 
  orderMiddleware.verifyOrderAccess, 
  orderController.resolveDispute
);

// Add review to order
router.post('/:id/reviews', 
  orderMiddleware.verifyOrderAccess, 
  orderMiddleware.verifyOrderStatus(['completed']), 
  orderController.addReview
);

// Upload attachments
router.post('/:id/attachments', 
  orderMiddleware.verifyOrderAccess, 
  orderController.uploadAttachment
);

module.exports = router;