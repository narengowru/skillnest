import React, { useState, useEffect } from 'react';
import { orderAPI, freelancerAPI } from '../api/api';
import { FaWhatsapp, FaEye, FaCheck, FaTimes, FaTimesCircle, FaStar } from 'react-icons/fa';
import './ClientOrdersDashboard.css';

const ORDER_STATUS = {
  CREATED: 'created',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
};

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case ORDER_STATUS.CREATED: return 'status-created';
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
                  {order.freelancerId.contactInfo && order.freelancerId.contactInfo.phone && (
                    <button 
                      className="whatsapp-btn"
                      onClick={() => handleWhatsAppChat(order.freelancerId.contactInfo.phone)}
                    >
                      <FaWhatsapp /> Chat on WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="order-actions">
              {order.status === ORDER_STATUS.CREATED && (
                <button 
                  className="reject-btn"
                  onClick={() => handleCancelOrder(order._id)}
                >
                  <FaTimes /> Cancel Order
                </button>
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