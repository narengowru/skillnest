const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getOrderDetails,
  handleWebhook
} = require('../controllers/razorpayController');

// Middleware to protect routes (you might want to add authentication middleware)
// const authMiddleware = require('../middleware/auth');

// POST /api/razorpay/create-order
// Create a new payment order
router.post('/create-order', createOrder);

// POST /api/razorpay/verify-payment
// Verify payment after successful payment
router.post('/verify-payment', verifyPayment);

// GET /api/razorpay/payment/:paymentId
// Get payment details by payment ID
router.get('/payment/:paymentId', getPaymentDetails);

// GET /api/razorpay/order/:orderId
// Get order details by order ID
router.get('/order/:orderId', getOrderDetails);

// POST /api/razorpay/webhook
// Handle Razorpay webhooks (server-to-server notifications)
router.post('/webhook', handleWebhook);

// GET /api/razorpay/key
// Get Razorpay public key for frontend
router.get('/key', (req, res) => {
  res.status(200).json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID
  });
});

module.exports = router;