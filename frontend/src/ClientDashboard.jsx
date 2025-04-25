import React, { useState, useEffect } from 'react';
import { clientAPI, jobAPI } from './api/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Star, Calendar, MapPin, Phone, Globe, Linkedin, Twitter, CreditCard, Building, FileText, CheckCircle, X, Edit, ChevronDown, ChevronUp, Clock, DollarSign, MessageCircle, Save, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ClientDashboard.css';
import { motion } from 'framer-motion';
import ProjectsSection from './components/ProjectsSection';
import ClientOrdersDashboard from './components/ClientOrdersDashboard';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    orders: true,
    reviews: true,
  });
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    location: {
      country: '',
      city: ''
    },
    bio: '',
    contactInfo: {
      phone: '',
      website: '',
      socialMedia: {
        linkedin: '',
        twitter: ''
      }
    },
    profilePicture: ''
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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
        
        // Initialize form data with client data
        setFormData({
          companyName: clientDetailsResponse.data.companyName,
          email: clientDetailsResponse.data.email,
          location: {
            country: clientDetailsResponse.data.location?.country || '',
            city: clientDetailsResponse.data.location?.city || ''
          },
          bio: clientDetailsResponse.data.bio || '',
          contactInfo: {
            phone: clientDetailsResponse.data.contactInfo?.phone || '',
            website: clientDetailsResponse.data.contactInfo?.website || '',
            socialMedia: {
              linkedin: clientDetailsResponse.data.contactInfo?.socialMedia?.linkedin || '',
              twitter: clientDetailsResponse.data.contactInfo?.socialMedia?.twitter || ''
            }
          },
          profilePicture: clientDetailsResponse.data.profilePicture || ''
        });
        
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

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          profilePicture: e.target.result
        });
        
        // If in editing mode, don't update client state yet
        // Otherwise update client state immediately for preview
        if (!editing) {
          setClient({
            ...client,
            profilePicture: e.target.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else if (name.includes('socialMedia.')) {
      const [, social] = name.split('socialMedia.');
      setFormData({
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          socialMedia: {
            ...formData.contactInfo.socialMedia,
            [social]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const toggleEdit = () => {
    setEditing(!editing);
  };

  const handleSaveChanges = async () => {
    try {
      // Ensure we have client ID
      if (!client || !client._id) {
        throw new Error('Client ID not found');
      }
      
      // Update client using the API
      await clientAPI.updateClient(client._id, formData);
      
      // Update local client state
      setClient({
        ...client,
        ...formData
      });
      
      // Turn off edit mode
      setEditing(false);
      
      // Show success toast
      showToastMessage('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToastMessage('Failed to update profile. Please try again.', 'error');
    }
  };

  const handleVerify = async () => {
    try {
      // Ensure we have client ID
      if (!client || !client._id) {
        throw new Error('Client ID not found');
      }
      
      // Update client verification status
      await clientAPI.updateClient(client._id, { verified: true });
      
      // Update local client state
      setClient({
        ...client,
        verified: true
      });
      
      // Show success toast
      showToastMessage('Account verified successfully!', 'success');
    } catch (err) {
      console.error('Error verifying account:', err);
      showToastMessage('Failed to verify account. Please try again.', 'error');
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handlePostJob = () => {
    navigate('/post-project');
  };

  const handleChatClick = () => {
    alert('Chat feature coming soon!');
  };

  // Calculate dashboard overview stats from client orders
  const calculateDashboardStats = () => {
    if (!client || !client.orders) {
      return {
        activeOrders: 0,
        totalSpent: 0,
        memberDuration: 0
      };
    }
    const ORDER_STATUS = {
      CREATED: 'created',
      IN_PROGRESS: 'in-progress',
      UNDER_REVIEW: 'under-review',
      COMPLETED: 'completed',
      CANCELED: 'canceled',
      DISPUTED: 'disputed'
    };
    const activeOrders = client.orders.filter(order => 
      order.status === ORDER_STATUS.IN_PROGRESS
  ).length;

    console.log('Active orders: ', activeOrders);
    
    const totalSpent = client.orders
      .filter(order => order.status === 'completed')
      .reduce((total, order) => total + (order.amount || 0), 0);
    
    const memberSince = new Date(client.memberSince || Date.now());
    const memberDuration = Math.floor((new Date() - memberSince) / (1000 * 60 * 60 * 24 * 30));
    
    return {
      activeOrders,
      totalSpent,
      memberDuration
    };
  };

  // Generate order status data for charts
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

  const { activeOrders, totalSpent, memberDuration } = calculateDashboardStats();
  const orderStatusData = generateOrderStatusData();

  return (
    <div className="client-dashboard">
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-icon">
            {toastType === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
          </div>
          <div className="toast-message">{toastMessage}</div>
          <button className="toast-close" onClick={() => setShowToast(false)}>
            <X size={16} />
          </button>
        </div>
      )}
      
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
          <button className="action-button" onClick={() => {
            handleMenuClick('profile');
            setTimeout(() => setEditing(true), 500);
          }}><Edit size={16} /> Edit Profile</button>
          <button className="action-button" onClick={handlePostJob}><FileText size={16} /> Post New Job</button>
          <button className="action-button notification-button" onClick={handleChatClick}>
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
                <p className="stat-value">{activeOrders}</p>
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
                <p className="stat-value">{memberDuration} months</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon spend-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <h3>Total Spent</h3>
                <p className="stat-value">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Orders Section */}
        <ProjectsSection 
        client={client} 
        handlePostJob={handlePostJob} 
      />
        
        <ClientOrdersDashboard
        client={client}
        />

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
                  {editing ? (
                    <input 
                      type="text" 
                      name="companyName" 
                      value={formData.companyName} 
                      onChange={handleInputChange}
                    />
                  ) : (
                    <input type="text" value={client.companyName} readOnly />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  {editing ? (
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange}
                    />
                  ) : (
                    <input type="email" value={client.email} readOnly />
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    {editing ? (
                      <input 
                        type="text" 
                        name="location.country" 
                        value={formData.location.country} 
                        onChange={handleInputChange}
                      />
                    ) : (
                      <input type="text" value={client.location?.country || ''} readOnly />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>City</label>
                    {editing ? (
                      <input 
                        type="text" 
                        name="location.city" 
                        value={formData.location.city} 
                        onChange={handleInputChange}
                      />
                    ) : (
                      <input type="text" value={client.location?.city || ''} readOnly />
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Bio / Company Description</label>
                  {editing ? (
                    <textarea 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleInputChange}
                    />
                  ) : (
                    <textarea readOnly value={client.bio || 'No bio provided yet.'} />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Contact Information</label>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Phone size={16} />
                      {editing ? (
                        <input 
                          type="text" 
                          name="contactInfo.phone" 
                          value={formData.contactInfo.phone} 
                          onChange={handleInputChange}
                          placeholder="Phone number"
                        />
                      ) : (
                        <span>{client.contactInfo?.phone || 'Not provided'}</span>
                      )}
                    </div>
                    <div className="contact-item">
                      <Globe size={16} />
                      {editing ? (
                        <input 
                          type="text" 
                          name="contactInfo.website" 
                          value={formData.contactInfo.website} 
                          onChange={handleInputChange}
                          placeholder="Website URL"
                        />
                      ) : (
                        <span>{client.contactInfo?.website || 'Not provided'}</span>
                      )}
                    </div>
                    <div className="contact-item">
                      <Linkedin size={16} />
                      {editing ? (
                        <input 
                          type="text" 
                          name="socialMedia.linkedin" 
                          value={formData.contactInfo.socialMedia.linkedin} 
                          onChange={handleInputChange}
                          placeholder="LinkedIn profile"
                        />
                      ) : (
                        <span>{client.contactInfo?.socialMedia?.linkedin || 'Not linked'}</span>
                      )}
                    </div>
                    <div className="contact-item">
                      <Twitter size={16} />
                      {editing ? (
                        <input 
                          type="text" 
                          name="socialMedia.twitter" 
                          value={formData.contactInfo.socialMedia.twitter} 
                          onChange={handleInputChange}
                          placeholder="Twitter profile"
                        />
                      ) : (
                        <span>{client.contactInfo?.socialMedia?.twitter || 'Not linked'}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  {editing ? (
                    <button className="primary-button save-button" onClick={handleSaveChanges}>
                      <Save size={16} /> Save Changes
                    </button>
                  ) : (
                    <button className="primary-button" onClick={toggleEdit}>
                      <Edit size={16} /> Edit Profile
                    </button>
                  )}
                  <button className="secondary-button">Change Password</button>
                </div>
              </div>
              
              <div className="profile-picture-section">
                <div className="profile-picture-container">
                  <img 
                    src={editing ? formData.profilePicture : client.profilePicture || '/default-profile.jpg'} 
                    alt={client.companyName} 
                  />
                  <div className="picture-overlay">
                    <label htmlFor="profilePicture" className="picture-edit-button">
                      <Edit size={16} />
                      <span>Change</span>
                    </label>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="file-input"
                      style={{ display: 'none' }}
                    />
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
                    <button className="verify-button" onClick={handleVerify}>Verify Now</button>
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