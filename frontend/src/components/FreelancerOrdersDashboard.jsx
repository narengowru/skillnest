import React, { useState, useEffect } from 'react';
import { orderAPI, clientAPI } from '../api/api';
import { FaEye, FaCheck, FaTimes, FaTimesCircle, FaStar } from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';
import '../css/FreelancerOrdersDashboard.css';

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

const ReviewModal = ({ order, onClose, onSubmit }) => {
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
      await onSubmit({
        freelancerId: order.freelancerId?._id,
        clientId: order.clientId?._id,
        rating,
        comment,
        orderId: order._id
      });
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
          <h2>Review Client: {order.clientId?.companyName}</h2>
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
                placeholder="Share your experience working with this client..."
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

          {order.clientId && (
            <div className="modal-section">
              <h3>Client Information</h3>
              <div className="detail-row">
                <span className="detail-label">Company:</span>
                <span className="detail-value">{order.clientId.companyName || 'N/A'}</span>
              </div>
              {order.clientId.contactInfo && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{order.clientId.email || 'N/A'}</span>
                  </div>
                  {/* <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{order.clientId.contactInfo.phone || 'N/A'}</span>
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

const FreelancerOrdersDashboard = ({ freelancer }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState([]);
  const [activeStatusTab, setActiveStatusTab] = useState('payment-pending');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!freelancer?._id) { setLoading(false); return; }
      setLoading(true);
      try {
        // Re-fetch freelancer to get the latest orders[] array (avoids stale prop)
        const { freelancerAPI } = await import('../api/api');
        const freshFreelancer = await freelancerAPI.getFreelancer(freelancer._id);
        const orderIds = freshFreelancer.data?.orders || [];

        if (orderIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const detailedOrders = await Promise.all(
          orderIds.map(async (orderId) => {
            const id = typeof orderId === 'object' ? orderId._id : orderId;
            try {
              const res = await orderAPI.getOrder(id);
              return res.data;
            } catch (err) {
              console.error(`Failed to fetch order ${id}:`, err);
              return null;
            }
          })
        );

        setOrders(detailedOrders.filter(Boolean));
        const storedReviewedOrders = JSON.parse(localStorage.getItem('reviewedOrders') || '[]');
        setReviewedOrders(storedReviewedOrders);
      } catch (err) {
        setError('Failed to fetch orders. Please try again later.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [freelancer?._id]);

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

      setSuccess('Order accepted! Waiting for client payment to start the project.');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept order');
      console.error('Error accepting order:', err);
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');

      console.log('Rejecting order', orderId);
      await orderAPI.updateOrder(orderId, { status: ORDER_STATUS.CANCELED });

      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: ORDER_STATUS.CANCELED } : order
        )
      );

      setSuccess('Order rejected successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject order');
      console.error('Error rejecting order:', err);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');

      console.log('Completing order', orderId);
      await orderAPI.updateOrder(orderId, { status: ORDER_STATUS.COMPLETED });

      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: ORDER_STATUS.COMPLETED } : order
        )
      );

      setSuccess('Order completed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete order');
      console.error('Error completing order:', err);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleWhatsAppChat = (clientPhone) => {
    // Format phone number if needed (remove spaces, add country code if missing)
    const formattedPhone = clientPhone?.startsWith('+')
      ? clientPhone.replace(/\s/g, '')
      : `+${clientPhone?.replace(/\s/g, '')}`;

    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleOpenChat = (client) => {
    window.dispatchEvent(new CustomEvent('open-chat-with-user', { detail: { userId: client._id } }));
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

  const handleSubmitReview = async (reviewData) => {
    try {
      // Send review to API
      console.log('Reviews: ', reviewData);
      await clientAPI.addReview(reviewData);

      // Add order ID to reviewedOrders to disable the review button
      const updatedReviewedOrders = [...reviewedOrders, reviewData.orderId];
      setReviewedOrders(updatedReviewedOrders);

      // Store in localStorage
      localStorage.setItem('reviewedOrders', JSON.stringify(updatedReviewedOrders));

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

  // Tab config — one entry per relevant status (no 'All' tab, 'created' excluded)
  const STATUS_TABS = [
    { key: 'payment-pending', label: '💳 Awaiting Payment', color: '#f59e0b', bg: '#fff8e1', border: '#fde68a' },
    { key: 'in-progress', label: '⚡ In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'under-review', label: '🔍 Under Review', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'completed', label: '✅ Completed', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { key: 'canceled', label: '✕ Cancelled', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
    { key: 'disputed', label: '⚠️ Disputed', color: '#dc2626', bg: '#fff1f2', border: '#fca5a5' },
  ];

  const filteredOrders = orders.filter(o => o.status === activeStatusTab);

  if (!freelancer) {
    return <div className="orders-empty">No orders found.</div>;
  }

  return (
    <div className="client-orders-dashboard">
      <h2>My Orders</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ── Status Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {STATUS_TABS.map(tab => {
          const count = orders.filter(o => o.status === tab.key).length;
          const active = activeStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveStatusTab(tab.key)}
              style={{
                padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: active ? tab.bg : '#f3f4f6',
                color: active ? tab.color : '#6b7280',
                fontWeight: active ? '700' : '600', fontSize: '13px',
                outline: active ? `1.5px solid ${tab.border}` : 'none',
                boxShadow: active ? `0 2px 8px ${tab.border}` : 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {tab.label}
              <span style={{
                background: active ? tab.color : '#e5e7eb',
                color: active ? '#fff' : '#6b7280',
                borderRadius: '20px', padding: '1px 8px',
                fontSize: '11px', fontWeight: '700',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Orders grid or empty state ── */}
      {filteredOrders.length === 0 ? (
        <div style={{
          border: '2px dashed #e5e7eb', borderRadius: '16px',
          padding: '50px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
          <p style={{ color: '#6b7280', margin: 0, fontWeight: '600' }}>
            No {STATUS_TABS.find(t => t.key === activeStatusTab)?.label.replace(/^[\S]+ /, '')} orders yet.
          </p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-header">
                <h3>{order.title}</h3>
                <StatusBadge status={order.status} />
              </div>

              <div className="order-details">
                <p><strong>Order ID:</strong> {order.orderId}</p>
                <p><strong>Amount:</strong> {order.currency} {order.totalAmount}</p>
                <p><strong>Due Date:</strong> {formatDate(order.dueDate)}</p>

                {order.clientId && (order.status === ORDER_STATUS.IN_PROGRESS || order.status === ORDER_STATUS.PAYMENT_PENDING) && (
                  <div className="freelancer-info">
                    <p><strong>Client:</strong> {order.clientId.companyName || 'N/A'}</p>
                    <button
                      className="chat-btn"
                      onClick={() => handleOpenChat(order.clientId)}
                    >
                      <MessageCircle /> Chat
                    </button>
                  </div>
                )}
              </div>

              <div className="order-actions">
                {(order.status === ORDER_STATUS.CREATED && order.whoPlaced !== 'freelancer') && (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptOrder(order._id)}
                    >
                      <FaCheck /> Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRejectOrder(order._id)}
                    >
                      <FaTimes /> Reject
                    </button>
                  </>
                )}

                {order.status === ORDER_STATUS.PAYMENT_PENDING && (
                  <div className="payment-pending-notice">
                    <p>Waiting for client payment to start the project</p>
                  </div>
                )}

                {order.status === ORDER_STATUS.IN_PROGRESS && (
                  <button
                    className="complete-btn"
                    onClick={() => handleCompleteOrder(order._id)}
                  >
                    <FaCheck /> Mark as Completed
                  </button>
                )}

                {order.status === ORDER_STATUS.COMPLETED && order.clientId && (
                  <button
                    className={`review-btn ${isOrderReviewed(order._id) ? 'reviewed' : ''}`}
                    onClick={() => openReviewModal(order)}
                    disabled={isOrderReviewed(order._id)}
                  >
                    <FaStar /> {isOrderReviewed(order._id) ? 'Client Reviewed' : 'Review Client'}
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
      )}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeModal} />
      )}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={closeReviewModal}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
};

export default FreelancerOrdersDashboard;