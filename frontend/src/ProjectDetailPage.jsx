import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProjectDetailPage.css';
import { jobAPI } from './api/api';
import { orderAPI } from './api/api';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setIsLoading(true);
        const response = await jobAPI.getJob(id);
        setProject(response.data);
        setIsLoading(false);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details. Please try again later.');
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);
  
  const handleApply = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('user');
      if (!token) {
        // Redirect to login if not logged in
        navigate('/login', { state: { redirectTo: `/details/${id}` } });
        return;
      }
      
      // Get current user info from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      console.log(user);
      
      if (!user || !user.id) {
        console.error('User information not found');
        setError('User profile information not found. Please log in again.');
        return;
      }
      
      console.log('Creating order with user:', user);
      console.log('Project details:', project);
      
      // Check if project.client exists
      if (!project.client) {
        console.error('Project client information is missing');
        setError('Client information is missing. Cannot create order.');
        return;
      }
      
      // Create new order data
      const orderData = {
        jobId: project._id,  // Use project._id for jobId
        clientId: project.client._id || project.client.id || "dummy-client-id", // Add fallback
        freelancerId: user.id,
        
        // Essential details
        title: project.title,
        description: project.description || 'Application for project',
        category: project.category || 'General',
        
        // Financial details - with fallbacks
        amount: project.budget ? parseFloat(project.budget.replace(/[^0-9.]/g, '')) : 100,
        currency: 'USD',
        totalAmount: project.budget ? parseFloat(project.budget.replace(/[^0-9.]/g, '')) * 1.1 : 110,
        
        // Timeline - set to one month from now
        dueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
        
        // Include simple message
        messages: [{
          content: "I'm interested in working on your project",
          sender: user.id,
          senderModel: 'Freelancer'
        }]
      };
      
      // Log the complete order data for debugging
      console.log('Submitting order data:', JSON.stringify(orderData, null, 2));
      
      // Call API to create order
      console.log('Wait');
      const response = await orderAPI.createOrder(orderData);
      console.log('Order created successfully:', response.data);
      
      // Show success toast notification
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
      
    } catch (err) {
      console.error('Error applying to job:', err);
      
      // More detailed error handling
      if (err.response) {
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        
        if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to submit application. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      
      // Show error toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`star-${i}`} className="star full-star">★</span>);
    }
    
    // Half star if needed
    if (hasHalfStar) {
      stars.push(<span key="half-star" className="star half-star">★</span>);
    }
    
    // Empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-star-${i}`} className="star empty-star">☆</span>);
    }
    
    return stars;
  };

  // Format date from ISO to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="not-found-container">
        <h2>Project Not Found</h2>
        <p>The project you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/jobs')}>Browse Other Projects</button>
      </div>
    );
  }

  return (
    <div className={`project-detail-container ${isLoaded ? 'fade-in' : ''}`}>
      {showToast && (
        <div className="toast-notification success-toast">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <h4>Application Sent!</h4>
            <p>We have successfully sent your application to the client. You will be notified once client accepts.</p>
          </div>
          <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
        </div>
      )}
      
      <div className="project-detail-card animate-in">
        <div className="project-image-container">
          <img 
            src={project.imageUrl || '/default-project-image.jpg'} 
            alt={project.title} 
            className="project-image hover-zoom"
          />
        </div>
        
        <div className="project-info-container">
          <h1 className="project-title">{project.title}</h1>
          
          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label"><i className="icon calendar">📅</i> Posted:</span>
              <span className="meta-value">{formatDate(project.datePosted)}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label"><i className="icon money">💰</i> Budget:</span>
              <span className="meta-value">{project.budget}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label"><i className="icon time">⏱️</i> Duration:</span>
              <span className="meta-value">{project.projectDuration}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label"><i className="icon category">🏷️</i> Category:</span>
              <span className="meta-value">{project.category}</span>
            </div>
          </div>
          
          <div className="project-highlights">
            <div className="highlight-item pulse">
              <div className="highlight-icon">🏆</div>
              <div className="highlight-text">
                <span className="highlight-value">{project.experienceLevel}</span>
                <span className="highlight-label">Experience</span>
              </div>
            </div>
            
            <div className="highlight-item pulse">
              <div className="highlight-icon">📊</div>
              <div className="highlight-text">
                <span className="highlight-value">{project.status === 'open' ? 'Active' : project.status}</span>
                <span className="highlight-label">Status</span>
              </div>
            </div>
          </div>
          
          <div className="project-description">
            <h2><i className="icon description">📝</i> Project Description</h2>
            <p>{project.description}</p>
          </div>
          
          {project.skills && project.skills.length > 0 && (
            <div className="project-skills">
              <h2><i className="icon skills">🔧</i> Skills Required</h2>
              <div className="skills-list">
                {project.skills.map((skill, index) => (
                  <span key={index} className="skill-tag animate-pop" style={{ color: 'white' }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Client Information Section */}
      {project.client && (
        <div className="client-info-card animate-in" style={{animationDelay: "0.2s"}}>
          <h2 className="section-title"><i className="icon client">👤</i> Client Information</h2>
          
          <div className="client-profile">
            <div className="client-avatar-container">
              <div className="client-avatar">
                <img 
                  src={project.client.avatar || '/default-avatar.jpg'} 
                  alt={`${project.client.name} avatar`} 
                />
              </div>
              {project.client.verificationBadge && (
                <div className="verification-badge rotate-in" title="Verified Client">✓</div>
              )}
            </div>
            
            <div className="client-details">
              <h3 className="client-name">
                {project.client.name}
              </h3>
              
              <div className="client-rating animate-sparkle">
                <div className="stars">
                  {renderStars(project.client.rating)}
                </div>
                <span className="rating-text">
                  {project.client.rating.toFixed(1)} 
                  <span className="reviews-count">({project.client.totalReviews} reviews)</span>
                </span>
              </div>
              
              <div className="client-meta">
                {project.client.memberSince && (
                  <div className="client-meta-item">
                    <span className="meta-icon">🗓️</span>
                    <span className="meta-label">Member since:</span>
                    <span className="meta-value">{project.client.memberSince}</span>
                  </div>
                )}
                
                {project.client.location && (
                  <div className="client-meta-item">
                    <span className="meta-icon">📍</span>
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{project.client.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {project.status === 'open' && (
        <div className="apply-float-button">
          <button className="float-btn pulse-button" onClick={handleApply}>Apply Now</button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;