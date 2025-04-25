import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { FaWhatsapp, FaEye, FaCheck, FaTimes, FaTimesCircle } from 'react-icons/fa';
import './FreelancerOrdersDashboard.css';

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

  useEffect(() => {
    const fetchOrders = async () => {
      if (freelancer && freelancer.orders && freelancer.orders.length > 0) {
        try {
          const detailedOrders = await Promise.all(
            freelancer.orders.map(async (orderId) => {
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
        } catch (err) {
          setError('Failed to fetch orders. Please try again later.');
          console.error('Error fetching orders:', err);
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, [freelancer]);

  const handleAcceptOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      
      console.log('Accepting order', orderId);
      await orderAPI.updateOrder(orderId, { status: ORDER_STATUS.IN_PROGRESS });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: ORDER_STATUS.IN_PROGRESS } : order
        )
      );
      
      setSuccess('Order accepted successfully!');
      
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

  const handleWhatsAppChat = (clientPhone) => {
    // Format phone number if needed (remove spaces, add country code if missing)
    const formattedPhone = clientPhone?.startsWith('+') 
      ? clientPhone.replace(/\s/g, '') 
      : `+${clientPhone?.replace(/\s/g, '')}`;
    
    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
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

  if (loading) {
    return <div className="orders-loading">Loading orders...</div>;
  }

  if (!freelancer || !orders || orders.length === 0) {
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
              
              {order.clientId && order.status === ORDER_STATUS.IN_PROGRESS && (
                <div className="freelancer-info">
                  <p><strong>Client:</strong> {order.clientId.companyName || 'N/A'}</p>
                  {order.clientId.contactInfo.phone && (
                    <button 
                      className="whatsapp-btn"
                      onClick={() => handleWhatsAppChat(order.clientId.contactInfo.phone)}
                    >
                      <FaWhatsapp /> Chat on WhatsApp
                    </button>
                  )}
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
                    onClick={() => handleRejectOrder(order._id)}
                  >
                    <FaTimes /> Reject
                  </button>
                </>
              )}
              
              {order.status === ORDER_STATUS.IN_PROGRESS && (
                <button 
                  className="complete-btn"
                  onClick={() => handleCompleteOrder(order._id)}
                >
                  <FaCheck /> Mark as Completed
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
    </div>
  );
};

export default FreelancerOrdersDashboard;