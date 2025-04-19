import React, { useState, useEffect } from 'react';
import { Star, Clock, Briefcase, Award, Mail, MapPin, Calendar, ArrowRight, Heart, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import './ViewProfile.css';
import { freelancerAPI, clientAPI, orderAPI } from './api/api'; // Added orderAPI and clientAPI

const ViewProfile = () => {
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [bookingStatus, setBookingStatus] = useState({
    isBooking: false,
    success: false,
    error: null,
    orderId: null
  });
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    // Extract ID from URL
    const pathParts = window.location.pathname.split('/');
    const freelancerId = pathParts[pathParts.length - 1];
    
    // Get client data from localStorage
    try {
      const clientStorageData = localStorage.getItem('user');
      if (clientStorageData) {
        setClientData(JSON.parse(clientStorageData));
      }
    } catch (err) {
      console.error('Error parsing client data from localStorage', err);
    }
    
    const fetchFreelancerData = async () => {
      try {
        setLoading(true);
        // Call the correct freelancerAPI.getFreelancer method
        const response = await freelancerAPI.getFreelancer(freelancerId);
        setFreelancer(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching freelancer data:', err);
        setError('Failed to load freelancer profile');
        setLoading(false);
      }
    };

    fetchFreelancerData();
  }, []);

  // Get client ID by email
  const getClientIdByEmail = async (email) => {
    try {
      // Get all clients and find the one with matching email
      const response = await clientAPI.getAllClients();
      const clientMatch = response.data.find(client => client.email === email);
      return clientMatch ? clientMatch._id : null;
    } catch (err) {
      console.error('Error fetching client data:', err);
      throw new Error('Could not retrieve client ID');
    }
  };

  const handleBookNow = async () => {
    // Check if freelancer data is available
    if (!freelancer) {
      setShowToast(true);
      setBookingStatus({
        isBooking: false,
        success: false,
        error: 'Freelancer data not available'
      });
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Check if client is logged in
    if (!clientData || !clientData.email || !clientData.isLoggedIn) {
      setShowToast(true);
      setBookingStatus({
        isBooking: false,
        success: false,
        error: 'Please log in as a client to book this freelancer'
      });
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setBookingStatus({ isBooking: true, success: false, error: null });

      // Get client ID from email
      const clientId = await getClientIdByEmail(clientData.email);
      console.log('Client ID', clientId);
      if (!clientId) {
        throw new Error('Client account not found');
      }

      // Calculate due date (30 days from now by default)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create order data
      const orderData = {
        jobId: freelancer._id, // Using freelancer ID as job ID for simplicity
        clientId: clientId,
        freelancerId: freelancer._id,
        title: `Project with ${freelancer.name || 'Freelancer'}`,
        description: `Collaboration with ${freelancer.name || 'Freelancer'} based on skills and profile match.`,
        category: freelancer.skills && freelancer.skills.length > 0 ? freelancer.skills[0].name : 'General',
        amount: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 40, // Default to 40 hours
        currency: 'USD',
        serviceFee: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 40 * 0.10, // 10% service fee
        totalAmount: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 40 * 1.10, // Including service fee
        paymentMethod: 'Credit Card',
        dueDate: dueDate.toISOString(),
        deliverables: ['Project files', 'Documentation', 'Source code'],
        milestones: [
          {
            title: 'Project Initiation',
            description: 'Initial planning and setup phase',
            amount: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 10, // 25% of total
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
            deliverables: ['Project plan', 'Initial setup'],
            status: 'pending'
          },
          {
            title: 'Development Phase',
            description: 'Main development work',
            amount: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 20, // 50% of total
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks
            deliverables: ['Working prototype', 'Progress report'],
            status: 'pending'
          },
          {
            title: 'Project Completion',
            description: 'Final delivery and review',
            amount: parseFloat(freelancer.hourlyRate?.replace(/[^0-9.]/g, '') || 0) * 10, // 25% of total
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 4 weeks
            deliverables: ['Final deliverables', 'Documentation'],
            status: 'pending'
          }
        ],
        terms: 'Standard terms and conditions apply.'
      };

      // Create the order
      const response = await orderAPI.createOrder(orderData);
      
      setBookingStatus({
        isBooking: false,
        success: true,
        error: null,
        orderId: response.data.orderId
      });
      
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error booking freelancer:', err);
      setBookingStatus({
        isBooking: false,
        success: false,
        error: err.message || 'Failed to create booking'
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  const nextProject = () => {
    if (!freelancer?.previousWork?.length) return;
    setCurrentProjectIndex((prev) => 
      prev === freelancer.previousWork.length - 1 ? 0 : prev + 1
    );
  };

  const prevProject = () => {
    if (!freelancer?.previousWork?.length) return;
    setCurrentProjectIndex((prev) => 
      prev === 0 ? freelancer.previousWork.length - 1 : prev - 1
    );
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Rating stars rendering
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={18} 
          fill={i <= rating ? "#FFD700" : "none"} 
          stroke={i <= rating ? "#FFD700" : "#ccc"} 
        />
      );
    }
    return stars;
  };

  // Calculate the percentage for review breakdown
  const calculatePercentage = (count) => {
    return (count / (freelancer?.ratings?.total || 1)) * 100;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading freelancer profile...</p>
      </div>
    );
  }

  // Show error state
  if (error || !freelancer) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error || "Could not find the requested freelancer profile"}</p>
        <button onClick={() => window.history.back()} className="back-button">
          Go Back
        </button>
      </div>
    );
  }

  // Safety check for required properties
  const hasPreviousWork = Array.isArray(freelancer.previousWork) && freelancer.previousWork.length > 0;
  const hasSkills = Array.isArray(freelancer.skills) && freelancer.skills.length > 0;
  const hasReviews = Array.isArray(freelancer.reviews) && freelancer.reviews.length > 0;
  const hasAchievements = Array.isArray(freelancer.achievements) && freelancer.achievements.length > 0;
  const hasEducation = freelancer.education && typeof freelancer.education === 'object';
  const hasRatings = freelancer.ratings && typeof freelancer.ratings === 'object';
  const hasSocialProfiles = freelancer.socialProfiles && typeof freelancer.socialProfiles === 'object';

  // Ensure currentProjectIndex is valid
  if (hasPreviousWork && currentProjectIndex >= freelancer.previousWork.length) {
    setCurrentProjectIndex(0);
  }

  // Get current project safely
  const currentProject = hasPreviousWork ? freelancer.previousWork[currentProjectIndex] || {} : {};

  return (
    <div className="view-profile-container">
      {/* Toast notification */}
      {showToast && (
        <div className="toast-notification success">
          <Check size={20} />
          <span>Booking request sent successfully! We'll notify you when {freelancer.name.split(' ')[0]} confirms.</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-background">
          <div className="overlay"></div>
        </div>
        
        <div className="profile-header-content">
          <div className="profile-photo-container">
            <img 
              src={freelancer.profilePhoto || '/default-avatar.png'} 
              alt={freelancer.name} 
              className="profile-photo" 
              onError={(e) => {e.target.onerror = null; e.target.src = '/default-avatar.png'}}
            />
            <div className="online-indicator" title="Currently Online"></div>
          </div>
          
          <div className="profile-header-info">
            <h1>{freelancer.name || 'Freelancer'} 
              <span 
                className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                onClick={toggleFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={24} fill={isFavorite ? "#ff6b6b" : "none"} stroke={isFavorite ? "#ff6b6b" : "#333"} />
              </span>
            </h1>
            <p className="tagline" style={{ color: 'white' }}>{freelancer.tagline || 'Skilled Freelancer'}</p>
            
            <div className="profile-meta">
              <div className="meta-item" style={{ color: 'white' }}>
                <MapPin size={16} />
                <span style={{ color: 'white' }}>{freelancer.location || 'Location not specified'}</span>
              </div>
              <div className="meta-item" style={{ color: 'white' }}>
                <Calendar size={16} />
                <span style={{ color: 'white' }}>Joined {freelancer.joinedDate || 'Recently'}</span>
              </div>
              {hasRatings && (
                <div className="meta-item rating-meta">
                  <div className="stars-container">
                    {renderStars(freelancer.ratings.average || 0)}
                  </div>
                  <span className="rating-text">
                    {freelancer.ratings.average || 0} ({freelancer.ratings.total || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-header-actions">
            <button className="book-now-button" onClick={handleBookNow}>
              Book Now
              <ArrowRight size={18} />
            </button>
            <div className="hourly-rate">
              <span className="rate-value">{freelancer.hourlyRate || '$0'}</span>
              <span className="rate-unit">/hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        <div className="profile-sidebar">
          <div className="sidebar-section quick-info">
            <h3>Quick Info</h3>
            <div className="quick-info-item">
              <Briefcase size={18} />
              <div>
                <span className="info-label">Completed Jobs</span>
                <span className="info-value">{freelancer.jobsCompleted || 0}</span>
              </div>
            </div>
            {freelancer.availability && (
              <div className="quick-info-item">
                <Clock size={18} />
                <div>
                  <span className="info-label">Availability</span>
                  <span className="info-value">
                    {(freelancer.availability.hoursPerWeek || 0) + ' hrs/week'}
                  </span>
                  <span className="info-subtext">
                    {freelancer.availability.schedule || 'Flexible schedule'}
                  </span>
                </div>
              </div>
            )}
            {freelancer.email && (
              <div className="quick-info-item">
                <Mail size={18} />
                <div>
                  <span className="info-label">Contact</span>
                  <a href={`mailto:${freelancer.email}`} className="info-value email">
                    {freelancer.email}
                  </a>
                </div>
              </div>
            )}
          </div>

          {hasSkills && (
            <div className="sidebar-section skills">
              <h3>Skills</h3>
              <div className="skills-list">
                {freelancer.skills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level">{skill.level || 0}%</span>
                    </div>
                    <div className="skill-progress-bg">
                      <div 
                        className="skill-progress" 
                        style={{ width: `${skill.level || 0}%` }}
                        data-aos="width"
                        data-aos-delay={index * 100}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasEducation && (
            <div className="sidebar-section education">
              <h3>Current Education</h3>
              <div className="education-content">
                <h4 className="university">{freelancer.education.university || 'University not specified'}</h4>
                <p className="degree">{freelancer.education.degree || 'Degree not specified'}</p>
                <p className="year">{freelancer.education.year || 'Year not specified'}</p>
                {freelancer.education.gpa && (
                  <div className="education-detail">
                    <span className="detail-label">GPA:</span>
                    <span className="detail-value">{freelancer.education.gpa}</span>
                  </div>
                )}
                {freelancer.education.relevantCourses && Array.isArray(freelancer.education.relevantCourses) && 
                 freelancer.education.relevantCourses.length > 0 && (
                  <div className="relevant-courses">
                    <h5>Relevant Courses:</h5>
                    <div className="courses-list">
                      {freelancer.education.relevantCourses.map((course, index) => (
                        <span key={index} className="course-tag">{course}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
            <button 
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
            <button 
              className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>

          {/* Portfolio Tab */}
          <div className={`tab-content ${activeTab === 'portfolio' ? 'active' : ''}`}>
            <h2 className="section-title">Previous Work</h2>
            
            {hasPreviousWork ? (
              <>
                <div className="portfolio-carousel">
                  <button className="carousel-button prev" onClick={prevProject}>
                    <ChevronLeft size={24} />
                  </button>
                  
                  <div className="portfolio-item">
                    <div className="portfolio-details">
                      <h3>{currentProject.title || 'Untitled Project'}</h3>
                      <p className="portfolio-client">
                        <span className="client-label">Client:</span> {currentProject.client || 'Unknown Client'}
                      </p>
                      <p className="portfolio-description">
                        {currentProject.description || 'No description available'}
                      </p>
                      {currentProject.feedback && (
                        <div className="portfolio-feedback">
                          <h4>Client Feedback:</h4>
                          <blockquote>
                            "{currentProject.feedback}"
                          </blockquote>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="carousel-button next" onClick={nextProject}>
                    <ChevronRight size={24} />
                  </button>
                </div>
                
                <div className="carousel-indicators">
                  {freelancer.previousWork.map((_, index) => (
                    <span 
                      key={index} 
                      className={`indicator ${index === currentProjectIndex ? 'active' : ''}`}
                      onClick={() => setCurrentProjectIndex(index)}
                    ></span>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No portfolio items available yet.</p>
              </div>
            )}
          </div>

          {/* About Tab */}
          <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
            <h2 className="section-title">About Me</h2>
            <div className="bio-section">
              <p className="bio-text">{freelancer.bio || 'Bio not available'}</p>
              
              {hasSocialProfiles && (
                <div className="social-profiles">
                  <h4>Connect with me:</h4>
                  <div className="social-links">
                    {freelancer.socialProfiles.github && (
                      <a 
                        href={`https://${freelancer.socialProfiles.github}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link github"
                      >
                        GitHub
                      </a>
                    )}
                    {freelancer.socialProfiles.linkedin && (
                      <a 
                        href={`https://${freelancer.socialProfiles.linkedin}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link linkedin"
                      >
                        LinkedIn
                      </a>
                    )}
                    {freelancer.socialProfiles.portfolio && (
                      <a 
                        href={`https://${freelancer.socialProfiles.portfolio}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="social-link portfolio"
                      >
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews Tab */}
          <div className={`tab-content ${activeTab === 'reviews' ? 'active' : ''}`}>
            <h2 className="section-title">Client Reviews</h2>
            
            {hasRatings && freelancer.ratings.total > 0 ? (
              <div className="rating-summary">
                <div className="overall-rating">
                  <div className="rating-value">{freelancer.ratings.average || 0}</div>
                  <div className="stars-display">
                    {renderStars(freelancer.ratings.average || 0)}
                  </div>
                  <div className="total-reviews">{freelancer.ratings.total || 0} reviews</div>
                </div>
                
                {freelancer.ratings.breakdown && (
                  <div className="rating-breakdown">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="breakdown-row">
                        <div className="stars-label">{rating} stars</div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar" 
                            style={{
                              width: `${calculatePercentage(
                                freelancer.ratings.breakdown[rating] || 0
                              )}%`
                            }}
                          ></div>
                        </div>
                        <div className="count-label">
                          {freelancer.ratings.breakdown[rating] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>No ratings available yet.</p>
              </div>
            )}
            
            {hasReviews ? (
              <div className="reviews-list">
                {freelancer.reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <img 
                        src={review.clientAvatar || '/default-avatar.png'} 
                        alt={review.clientName || 'Client'} 
                        className="client-avatar" 
                        onError={(e) => {e.target.onerror = null; e.target.src = '/default-avatar.png'}}
                      />
                      <div className="review-meta">
                        <h4 className="client-name">{review.clientName || 'Anonymous Client'}</h4>
                        <div className="review-details">
                          <div className="review-stars">
                            {renderStars(review.rating || 0)}
                          </div>
                          <span className="review-date">{review.date || 'Recent'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="review-content">
                      <p>{review.comment || 'No comment provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No reviews available yet.</p>
              </div>
            )}
          </div>

          {/* Achievements Tab */}
          <div className={`tab-content ${activeTab === 'achievements' ? 'active' : ''}`}>
            <h2 className="section-title">Achievements</h2>
            
            {hasAchievements ? (
              <div className="achievements-grid">
                {freelancer.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">{achievement.icon || '🏆'}</div>
                    <div className="achievement-details">
                      <h3 className="achievement-title">{achievement.title || 'Achievement'}</h3>
                      <span className="achievement-date">{achievement.date || 'Recent'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No achievements available yet.</p>
              </div>
            )}
            
            <div className="stats-section">
              <h3>Performance Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">98%</div>
                  <div className="stat-label">On-time Delivery</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Response Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">95%</div>
                  <div className="stat-label">Repeat Clients</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">4.8/5</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to work with {(freelancer.name || '').split(' ')[0] || 'this freelancer'}?</h2>
          <p>Get your project started today with one of our top-rated student freelancers!</p>
        </div>
        <button className="book-now-button large" onClick={handleBookNow}>
          Book Now
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ViewProfile;