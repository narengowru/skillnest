const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // Create order options
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture payment
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(orderOptions);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      },
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    // Create signature string
    const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signatureString)
      .digest('hex');

    // Verify signature
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Payment verification successful
      // Here you can update your database with payment details
      
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentDetails: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Get Payment Details
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        created_at: payment.created_at,
        order_id: payment.order_id
      }
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

// Handle Payment Webhook (for server-to-server notifications)
const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // You'll need to add this to your .env

    if (webhookSecret) {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }
    }

    const { event, payload } = req.body;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.payment.entity);
        // Update your database with successful payment
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity);
        // Handle failed payment
        break;
      
      case 'order.paid':
        console.log('Order paid:', payload.order.entity);
        // Handle successful order completion
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getOrderDetails,
  handleWebhook
};