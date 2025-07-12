import React, { useState, useEffect } from 'react';
import { orderAPI, freelancerAPI } from '../api/api';
import { FaWhatsapp, FaEye, FaCheck, FaTimes, FaTimesCircle, FaStar, FaCreditCard } from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';
import './ClientOrdersDashboard.css';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
};

const ORDER_STATUS = {
  CREATED: 'created',
  PAYMENT_PENDING: 'payment-pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case ORDER_STATUS.CREATED: return 'status-created';
      case ORDER_STATUS.PAYMENT_PENDING: return 'status-payment-pending';
      case ORDER_STATUS.IN_PROGRESS: return 'status-in-progress';
      case ORDER_STATUS.COMPLETED: return 'status-completed';
      case ORDER_STATUS.CANCELED: return 'status-canceled';
      default: return '';
    }
  };

  return <span className={`status-badge ${getStatusClass()}`}>{status}</span>;
};

const ReviewModal = ({ order, client, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Please add a comment to your review');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const reviewData = {
        clientName: client.companyName || client.name || client.email,
        clientAvatar: client.profilePicture || '',
        rating,
        comment
      };
      
      await onSubmit(order.freelancerId?._id, reviewData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content review-modal">
        <div className="modal-header">
          <h2>Review Freelancer: {order.freelancerId?.name || order.freelancerId?.email}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimesCircle />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star-icon ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  />
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="review-comment">Your Review</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working with this freelancer..."
                rows={5}
              />
            </div>
            
            {error && <div className="form-error">{error}</div>}
            
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{order.title}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimesCircle />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-section">
            <h3>Order Information</h3>
            <div className="detail-row">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">{order.orderId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Due Date:</span>
              <span className="detail-value">{formatDate(order.dueDate)}</span>
            </div>
          </div>

          <div className="modal-section">
            <h3>Payment Details</h3>
            <div className="detail-row">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">{order.currency} {order.totalAmount}</span>
            </div>
            {order.paymentStatus && (
              <div className="detail-row">
                <span className="detail-label">Payment Status:</span>
                <span className="detail-value">{order.paymentStatus}</span>
              </div>
            )}
          </div>

          {order.freelancerId && (
            <div className="modal-section">
              <h3>Freelancer Information</h3>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{order.freelancerId.name || 'N/A'}</span>
              </div>
              {order.freelancerId.contactInfo && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{order.freelancerId.email || 'N/A'}</span>
                  </div>
                  {/* <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{order.freelancerId.contactInfo.phone || 'N/A'}</span>
                  </div> */}
                </>
              )}
            </div>
          )}

          {order.description && (
            <div className="modal-section">
              <h3>Description</h3>
              <p className="order-description">{order.description}</p>
            </div>
          )}

          {order.requirements && (
            <div className="modal-section">
              <h3>Requirements</h3>
              <p className="order-requirements">{order.requirements}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientOrdersDashboard = ({ client }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (client && client.orders && client.orders.length > 0) {
        try {
          const detailedOrders = await Promise.all(
            client.orders.map(async (orderId) => {
              try {
                const response = await orderAPI.getOrder(orderId._id);
                return response.data;
              } catch (err) {
                console.error(`Failed to fetch order ${orderId}:`, err);
                return null;
              }
            })
          );
          
          setOrders(detailedOrders.filter(order => order !== null));
          
          // Load reviewed orders from localStorage
          const storedReviewedOrders = JSON.parse(localStorage.getItem('clientReviewedOrders') || '[]');
          setReviewedOrders(storedReviewedOrders);
        } catch (err) {
          setError('Failed to fetch orders. Please try again later.');
          console.error('Error fetching orders:', err);
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, [client]);

  const handleAcceptOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      
      console.log('Accepting order', orderId);
      await orderAPI.updateOrder(orderId, { status: ORDER_STATUS.PAYMENT_PENDING });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: ORDER_STATUS.PAYMENT_PENDING } : order
        )
      );
      
      setSuccess('Order accepted! Please complete the payment to start the project.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept order');
      console.error('Error accepting order:', err);
    }
  };

  const handlePayment = async (order) => {
    try {
      setError('');
      setSuccess('');
      
      // Load Razorpay script
      const Razorpay = await loadRazorpayScript();
      
      // Create order on backend
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: order.totalAmount,
          currency: 'INR',
          receipt: `order_${new Date().toISOString().replace(/[:.]/g, '-')}`
        })
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }
      
      // Initialize Razorpay payment
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'SkillNest',
        description: `Payment for ${order.title}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              // Update order status to in-progress
              await orderAPI.updateOrder(order._id, { 
                status: ORDER_STATUS.IN_PROGRESS,
                paymentStatus: 'paid'
              });
              
              // Update local state
              setOrders(prevOrders => 
                prevOrders.map(o => 
                  o._id === order._id ? { 
                    ...o, 
                    status: ORDER_STATUS.IN_PROGRESS,
                    paymentStatus: 'paid'
                  } : o
                )
              );
              
              setSuccess('Payment successful! Project is now in progress.');
              setTimeout(() => setSuccess(''), 3000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', err);
          }
        },
        prefill: {
          name: client.name || client.companyName || '',
          email: client.email || '',
        },
        theme: {
          color: '#3399cc'
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.open();
      
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      console.error('Payment error:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      
      console.log('Canceling order', orderId);
      await orderAPI.updateOrder(orderId, { status: ORDER_STATUS.CANCELED });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: ORDER_STATUS.CANCELED } : order
        )
      );
      
      setSuccess('Order canceled successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
      console.error('Error canceling order:', err);
    }
  };

  const handleWhatsAppChat = (freelancerPhone) => {
    // Format phone number if needed (remove spaces, add country code if missing)
    const formattedPhone = freelancerPhone?.startsWith('+') 
      ? freelancerPhone.replace(/\s/g, '') 
      : `+${freelancerPhone?.replace(/\s/g, '')}`;
    
    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleOpenChat = (freelancer) => {
    window.dispatchEvent(new CustomEvent('open-chat-with-user', { detail: { userId: freelancer._id } }));
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const openReviewModal = (order) => {
    setReviewOrder(order);
  };

  const closeReviewModal = () => {
    setReviewOrder(null);
  };

  const handleSubmitReview = async (freelancerId, reviewData) => {
    try {
      // Send review to API using the correct API structure
      console.log('Submitting review for freelancer:', freelancerId, reviewData);
      await freelancerAPI.addReview(freelancerId, reviewData);
    
      // Add order ID to reviewedOrders to disable the review button
      const updatedReviewedOrders = [...reviewedOrders, reviewData.orderId || reviewOrder._id];
      setReviewedOrders(updatedReviewedOrders);
      
      // Store in localStorage - use a different key for client reviews
      localStorage.setItem('clientReviewedOrders', JSON.stringify(updatedReviewedOrders));
      
      setSuccess('Review submitted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error submitting review:', error);
      return Promise.reject(new Error('Failed to submit review'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOrderReviewed = (orderId) => {
    return reviewedOrders.includes(orderId);
  };

  if (loading) {
    return <div className="orders-loading">Loading orders...</div>;
  }

  if (!client || !orders || orders.length === 0) {
    return <div className="orders-empty">No orders found.</div>;
  }

  return (
    <div className="client-orders-dashboard">
      <h2>My Orders</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="orders-grid">
        {orders.map((order) => (
          <div className="order-card" key={order._id}>
            <div className="order-header">
              <h3>{order.title}</h3>
              <StatusBadge status={order.status} />
            </div>
            
            <div className="order-details">
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Amount:</strong> {order.currency} {order.totalAmount}</p>
              <p><strong>Due Date:</strong> {formatDate(order.dueDate)}</p>
              
              {order.freelancerId && (order.status === ORDER_STATUS.IN_PROGRESS || order.status === ORDER_STATUS.COMPLETED) && (
                <div className="freelancer-info">
                  <p><strong>Freelancer:</strong> {order.freelancerId.name || order.freelancerId.email || 'N/A'}</p>
                  <button 
                    className="chat-btn"
                    onClick={() => handleOpenChat(order.freelancerId)}
                  >
                    <MessageCircle /> Chat
                  </button>
                </div>
              )}
            </div>
            
            <div className="order-actions">
              {order.status === ORDER_STATUS.CREATED && (
                <>
                  <button 
                    className="accept-btn"
                    onClick={() => handleAcceptOrder(order._id)}
                  >
                    <FaCheck /> Accept
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    <FaTimes /> Cancel Order
                  </button>
                </>
              )}
              
              {order.status === ORDER_STATUS.PAYMENT_PENDING && (
                <>
                  <button 
                    className="payment-btn"
                    onClick={() => handlePayment(order)}
                  >
                    <FaCreditCard /> Pay Now
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    <FaTimes /> Cancel Order
                  </button>
                </>
              )}
              
              {order.status === ORDER_STATUS.COMPLETED && order.freelancerId && (
                <button 
                  className={`review-btn ${isOrderReviewed(order._id) ? 'reviewed' : ''}`}
                  onClick={() => openReviewModal(order)}
                  disabled={isOrderReviewed(order._id)}
                >
                  <FaStar /> {isOrderReviewed(order._id) ? 'Freelancer Reviewed' : 'Review Freelancer'}
                </button>
              )}
              
              <button 
                className="view-btn"
                onClick={() => handleViewDetails(order)}
              >
                <FaEye /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeModal} />
      )}

      {reviewOrder && (
        <ReviewModal 
          order={reviewOrder}
          client={client}
          onClose={closeReviewModal} 
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
};

export default ClientOrdersDashboard;