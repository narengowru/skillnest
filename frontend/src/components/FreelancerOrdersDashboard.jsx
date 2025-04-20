import React, { useState, useEffect } from 'react';
import { orderAPI } from '../api/api';
import { FaWhatsapp, FaEye, FaEdit } from 'react-icons/fa';
import './FreelancerOrdersDashboard.css';

const ORDER_STATUS = {
  CREATED: 'created',
  IN_PROGRESS: 'in-progress',
  UNDER_REVIEW: 'under-review',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  DISPUTED: 'disputed'
};

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case ORDER_STATUS.CREATED: return 'status-created';
      case ORDER_STATUS.IN_PROGRESS: return 'status-in-progress';
      case ORDER_STATUS.UNDER_REVIEW: return 'status-review';
      case ORDER_STATUS.COMPLETED: return 'status-completed';
      case ORDER_STATUS.CANCELED: return 'status-canceled';
      case ORDER_STATUS.DISPUTED: return 'status-disputed';
      default: return '';
    }
  };

  return <span className={`status-badge ${getStatusClass()}`}>{status}</span>;
};

const FreelancerOrdersDashboard = ({ freelancer }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOrderId, setEditOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleUpdateStatus = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      
      if (!newStatus) {
        setError('Please select a status');
        return;
      }
      
      console.log('Updated ', orderId);
      await orderAPI.updateOrder(orderId, { status: newStatus });
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      setEditOrderId(null);
      setNewStatus('');
      setSuccess('Order status updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      console.error('Error updating order:', err);
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

  console.log('Orders', orders);

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
              
              {order.clientId && (
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
            
            <div className="order-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${orderAPI.calculateProgress(order)}%` }}
                ></div>
              </div>
              <span>{orderAPI.calculateProgress(order)}% Complete</span>
            </div>
            
            <div className="order-actions">
              {editOrderId === order._id ? (
                <div className="status-edit">
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="">Select Status</option>
                    {Object.values(ORDER_STATUS).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button 
                    className="save-btn"
                    onClick={() => handleUpdateStatus(order._id)}
                  >
                    Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setEditOrderId(null);
                      setNewStatus('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="edit-btn"
                    onClick={() => setEditOrderId(order._id)}
                  >
                    <FaEdit /> Update Status
                  </button>
                  <button className="view-btn">
                    <FaEye /> View Details
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FreelancerOrdersDashboard;