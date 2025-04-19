import React, { useState, useEffect } from 'react';
import { clientAPI } from './api/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Star, Calendar, MapPin, Phone, Globe, Linkedin, Twitter, CreditCard, Paypal, Building, FileText, CheckCircle, X, Edit, ChevronDown, ChevronUp, Clock, DollarSign, MessageCircle } from 'lucide-react';
import './ClientDashboard.css';
import { motion } from 'framer-motion';

const ClientDashboard = () => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    orders: true,
    reviews: true,
    payments: true
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        // Parse user from localStorage
        const userString = localStorage.getItem('user');
        if (!userString) {
          throw new Error('User not found in local storage');
        }
        
        const user = JSON.parse(userString);
        if (!user.email || user.userType !== 'client') {
          throw new Error('Invalid user data');
        }
        
        // Get all clients and find the one matching our email
        const allClientsResponse = await clientAPI.getAllClients();
        const matchingClient = allClientsResponse.data.find(c => c.email === user.email);
        
        if (!matchingClient) {
          throw new Error('Client profile not found');
        }
        
        // Get full client details with the ID
        const clientDetailsResponse = await clientAPI.getClient(matchingClient._id);
        setClient(clientDetailsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(err.message || 'Failed to load client dashboard');
        setLoading(false);
      }
    };

    fetchClientData();
    
    // Add animation effect when component mounts
    document.body.classList.add('dashboard-active');
    
    return () => {
      document.body.classList.remove('dashboard-active');
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleMenuClick = (section) => {
    setActiveSection(section);
    // Smooth scroll to the section
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate random data for demonstration purposes
  const generateOrderStatusData = () => {
    if (!client || !client.orders) return [];
    
    const statuses = ['in_progress', 'pending', 'completed', 'canceled'];
    const statusCounts = statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    
    // Count orders by status
    client.orders.forEach(order => {
      const status = order.status || 'pending';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });
    
    // Convert to chart format
    return Object.keys(statusCounts).map(status => ({
      name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: statusCounts[status]
    }));
  };

  const generateMonthlySpendingData = () => {
    // This would normally come from real data
    return [
      { name: 'Jan', amount: 4000 },
      { name: 'Feb', amount: 3000 },
      { name: 'Mar', amount: 2000 },
      { name: 'Apr', amount: 2780 },
      { name: 'May', amount: 1890 },
      { name: 'Jun', amount: 2390 }
    ];
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <X size={48} />
        <h2>Oops! We encountered an error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="dashboard-error">
        <User size={48} />
        <h2>Client profile not found</h2>
        <p>We couldn't find your profile information. Please log in again.</p>
        <button onClick={() => window.location.href = '/login'}>Go to Login</button>
      </div>
    );
  }

  const orderStatusData = generateOrderStatusData();
  const monthlySpendingData = generateMonthlySpendingData();

  return (
    <div className="client-dashboard">
      {/* Dashboard Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-header"
      >
        <div className="profile-snapshot">
          <div className="profile-pic">
            <img 
              src={client.profilePicture || '/default-profile.jpg'} 
              alt={client.companyName} 
            />
            {client.verified && (
              <span className="verified-badge" title="Verified Account">
                <CheckCircle size={16} />
              </span>
            )}
          </div>
          <div className="profile-info">
            <h1>{client.companyName} <span className="welcome-text">👋</span></h1>
            <div className="profile-meta">
              <span><MapPin size={14} /> {client.location?.country}, {client.location?.city || 'N/A'}</span>
              <span><Star size={14} /> {clientAPI.getClientRating(client)} Rating</span>
              <span><Calendar size={14} /> Member since {clientAPI.getClientSince(client)}</span>
            </div>
          </div>
        </div>
        <div className="quick-actions">
          <button className="action-button"><Edit size={16} /> Edit Profile</button>
          <button className="action-button"><FileText size={16} /> Post New Job</button>
          <button className="action-button notification-button">
            <MessageCircle size={16} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </motion.header>

      {/* Dashboard Navigation */}
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="dashboard-nav"
      >
        <ul>
          <li className={activeSection === 'overview' ? 'active' : ''}>
            <button onClick={() => handleMenuClick('overview')}>Overview</button>
          </li>
          <li className={activeSection === 'orders' ? 'active' : ''}>
            <button onClick={() => handleMenuClick('orders')}>Orders & Projects</button>
          </li>
          <li className={activeSection === 'reviews' ? 'active' : ''}>
            <button onClick={() => handleMenuClick('reviews')}>Reviews</button>
          </li>
          <li className={activeSection === 'payments' ? 'active' : ''}>
            <button onClick={() => handleMenuClick('payments')}>Payment Methods</button>
          </li>
          <li className={activeSection === 'profile' ? 'active' : ''}>
            <button onClick={() => handleMenuClick('profile')}>Profile Settings</button>
          </li>
        </ul>
      </motion.nav>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Overview Section */}
        <motion.section 
          id="overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="dashboard-section overview-section"
        >
          <h2>Dashboard Overview <span className="emoji">📊</span></h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon orders-icon">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>Active Orders</h3>
                <p className="stat-value">{client.orders?.length || 0}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon rating-icon">
                <Star size={24} />
              </div>
              <div className="stat-info">
                <h3>Overall Rating</h3>
                <p className="stat-value">{clientAPI.getClientRating(client)} <span className="text-sm">/ 5</span></p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon time-icon">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>Member Duration</h3>
                <p className="stat-value">{Math.floor((new Date() - new Date(client.memberSince)) / (1000 * 60 * 60 * 24 * 30))} months</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon spend-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <h3>Total Spent</h3>
                <p className="stat-value">$12,450</p>
              </div>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <h3>Order Status <span className="emoji">📈</span></h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Monthly Spending <span className="emoji">💰</span></h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlySpendingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" name="Amount Spent ($)" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Orders Section */}
        <motion.section 
          id="orders"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="dashboard-section"
        >
          <div className="section-header" onClick={() => toggleSection('orders')}>
            <h2>Orders & Projects <span className="emoji">📋</span></h2>
            <button className="toggle-button">
              {expandedSections.orders ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {expandedSections.orders && (
            <div className="order-list">
              {client.orders && client.orders.length > 0 ? (
                client.orders.map((order, index) => (
                  <div className="order-card" key={order._id || index}>
                    <div className="order-header">
                      <h3>Order #{order._id?.substring(0, 8) || `DEMO${index + 1}`}</h3>
                      <span className={`order-status status-${order.status || 'pending'}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>Freelancer:</strong> {order.freelancerName || 'John Doe'}</p>
                      <p><strong>Service:</strong> {order.serviceName || 'Web Development'}</p>
                      <p><strong>Due Date:</strong> {new Date(order.dueDate || Date.now()).toLocaleDateString()}</p>
                      <p><strong>Amount:</strong> ${order.amount || (1000 + index * 500).toFixed(2)}</p>
                    </div>
                    <div className="order-actions">
                      <button className="action-button">View Details</button>
                      <button className="action-button">Message Freelancer</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No Orders Yet</h3>
                  <p>You haven't placed any orders yet. Ready to start a project?</p>
                  <button className="primary-button">Post a New Job</button>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Reviews Section */}
        <motion.section 
          id="reviews"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="dashboard-section"
        >
          <div className="section-header" onClick={() => toggleSection('reviews')}>
            <h2>Your Reviews <span className="emoji">⭐</span></h2>
            <button className="toggle-button">
              {expandedSections.reviews ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {expandedSections.reviews && (
            <div className="reviews-container">
              {client.reviews && client.reviews.length > 0 ? (
                client.reviews.map((review, index) => (
                  <div className="review-card" key={review._id || index}>
                    <div className="review-header">
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={i < review.rating ? 'star-filled' : 'star-empty'} 
                            fill={i < review.rating ? '#FFD700' : 'none'} 
                          />
                        ))}
                      </div>
                      <div className="review-date">
                        {new Date(review.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="review-content">
                      <p>"{review.comment}"</p>
                    </div>
                    <div className="review-footer">
                      <span className="reviewer">
                        <strong>Freelancer ID:</strong> {review.freelancerId}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Star size={48} />
                  <h3>No Reviews Yet</h3>
                  <p>You haven't reviewed any freelancers yet. After completing a project, consider leaving feedback!</p>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Payment Methods Section */}
        <motion.section 
          id="payments"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="dashboard-section"
        >
          <div className="section-header" onClick={() => toggleSection('payments')}>
            <h2>Payment Methods <span className="emoji">💳</span></h2>
            <button className="toggle-button">
              {expandedSections.payments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {expandedSections.payments && (
            <div className="payment-methods">
              {client.paymentMethods && client.paymentMethods.length > 0 ? (
                client.paymentMethods.map((method, index) => (
                  <div className="payment-card" key={index}>
                    <div className="payment-icon">
                      {method.type === 'credit_card' && <CreditCard size={24} />}
                      {method.type === 'paypal' && <Paypal size={24} />}
                      {method.type === 'bank_transfer' && <Building size={24} />}
                    </div>
                    <div className="payment-details">
                      <h3>
                        {method.type === 'credit_card' && 'Credit Card'}
                        {method.type === 'paypal' && 'PayPal'}
                        {method.type === 'bank_transfer' && 'Bank Transfer'}
                        {method.isDefault && <span className="default-badge">Default</span>}
                      </h3>
                      {method.last4Digits && (
                        <p>•••• •••• •••• {method.last4Digits}</p>
                      )}
                      {method.expiryDate && (
                        <p>Expires: {method.expiryDate}</p>
                      )}
                    </div>
                    <div className="payment-actions">
                      <button className="action-button">Edit</button>
                      <button className="action-button danger">Remove</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <CreditCard size={48} />
                  <h3>No Payment Methods</h3>
                  <p>You haven't added any payment methods yet. Add one to start hiring freelancers.</p>
                  <button className="primary-button">Add Payment Method</button>
                </div>
              )}

              <button className="add-payment-button">
                <span>+ Add New Payment Method</span>
              </button>
            </div>
          )}
        </motion.section>

        {/* Profile Settings Section */}
        <motion.section 
          id="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="dashboard-section"
        >
          <div className="section-header" onClick={() => toggleSection('profile')}>
            <h2>Profile Settings <span className="emoji">👤</span></h2>
            <button className="toggle-button">
              {expandedSections.profile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {expandedSections.profile && (
            <div className="profile-settings">
              <div className="profile-form">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" value={client.companyName} readOnly />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={client.email} readOnly />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <input type="text" value={client.location?.country || ''} readOnly />
                  </div>
                  
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={client.location?.city || ''} readOnly />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Bio / Company Description</label>
                  <textarea readOnly value={client.bio || 'No bio provided yet.'} />
                </div>
                
                <div className="form-group">
                  <label>Contact Information</label>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Phone size={16} />
                      <span>{client.contactInfo?.phone || 'Not provided'}</span>
                    </div>
                    <div className="contact-item">
                      <Globe size={16} />
                      <span>{client.contactInfo?.website || 'Not provided'}</span>
                    </div>
                    <div className="contact-item">
                      <Linkedin size={16} />
                      <span>{client.contactInfo?.socialMedia?.linkedin || 'Not linked'}</span>
                    </div>
                    <div className="contact-item">
                      <Twitter size={16} />
                      <span>{client.contactInfo?.socialMedia?.twitter || 'Not linked'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button className="primary-button">Edit Profile</button>
                  <button className="secondary-button">Change Password</button>
                </div>
              </div>
              
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                  <img 
                    src={client.profilePicture || '/default-profile.jpg'} 
                    alt={client.companyName} 
                  />
                  <div className="picture-overlay">
                    <button className="picture-edit-button">
                      <Edit size={16} />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
                <div className="account-status">
                  <h3>Account Status</h3>
                  <div className={`status-indicator ${client.verified ? 'verified' : 'unverified'}`}>
                    {client.verified ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Verified Account</span>
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        <span>Unverified Account</span>
                      </>
                    )}
                  </div>
                  {!client.verified && (
                    <button className="verify-button">Verify Now</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      {/* Dashboard Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="dashboard-footer"
      >
        <p>© 2025 Freelancer Platform • Need help? <a href="/support">Contact Support</a></p>
      </motion.footer>
    </div>
  );
};

export default ClientDashboard;