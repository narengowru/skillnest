import React, { useState, useEffect } from 'react';
import './ProjectDetailPage.css';

const ProjectDetailPage = ({ project }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  const handleApply = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  // If no project is provided, show a placeholder
  const defaultProject = {
    id: 1,
    title: "E-commerce Website Redesign",
    imageUrl: "https://i.pinimg.com/736x/1d/fe/0f/1dfe0f0f330ef4b5f234045d4d39b2c9.jpg",
    datePosted: "April 15, 2025",
    budget: "$2,500 - $3,500",
    description: "Looking for an experienced web designer to redesign our e-commerce platform. The project includes updating the UI/UX, improving mobile responsiveness, and implementing new product filtering features. The ideal candidate will have experience with modern design principles and e-commerce best practices.",
    skills: ["Web Design", "UI/UX", "Responsive Design", "E-commerce"],
    client: {
      name: "TechSolutions Inc.",
      avatar: "https://i.pinimg.com/736x/15/34/92/153492d5cc36e23919920d27ab4b08cc.jpg",
      rating: 4.8,
      totalReviews: 47,
      memberSince: "May 2022",
      location: "San Francisco, CA",
      verificationBadge: true
    },
    projectDuration: "2-3 months",
    experienceLevel: "Intermediate to Expert",
  };

  const displayProject = project || defaultProject;
  
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
            src={displayProject.imageUrl} 
            alt={displayProject.title} 
            className="project-image hover-zoom"
          />
          {/* Removed the image overlay with "View Gallery" text */}
        </div>
        
        <div className="project-info-container">
          <h1 className="project-title">{displayProject.title}</h1>
          
          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label"><i className="icon calendar">📅</i> Posted:</span>
              <span className="meta-value">{displayProject.datePosted}</span>
            </div>
            
            <div className="meta-item">
              <span className="meta-label"><i className="icon money">💰</i> Budget:</span>
              <span className="meta-value">{displayProject.budget}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label"><i className="icon time">⏱️</i> Duration:</span>
              <span className="meta-value">{displayProject.projectDuration}</span>
            </div>
          </div>
          
          <div className="project-highlights">
            
            
            <div className="highlight-item pulse">
              <div className="highlight-icon">🏆</div>
              <div className="highlight-text">
                <span className="highlight-value">{displayProject.experienceLevel}</span>
                <span className="highlight-label">Experience</span>
              </div>
            </div>
          </div>
          
          <div className="project-description">
            <h2><i className="icon description">📝</i> Project Description</h2>
            <p>{displayProject.description}</p>
          </div>
          
          {displayProject.skills && displayProject.skills.length > 0 && (
            <div className="project-skills">
              <h2><i className="icon skills">🔧</i> Skills Required</h2>
              <div className="skills-list">
                {displayProject.skills.map((skill, index) => (
                  <span key={index} className="skill-tag animate-pop" style={{ color: 'white' }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
          

        </div>
      </div>
      
      {/* Client Information Section */}
      {displayProject.client && (
        <div className="client-info-card animate-in" style={{animationDelay: "0.2s"}}>
          <h2 className="section-title"><i className="icon client">👤</i> Client Information</h2>
          
          <div className="client-profile">
            <div className="client-avatar-container">
              <div className="client-avatar">
                <img 
                  src={displayProject.client.avatar} 
                  alt={`${displayProject.client.name} avatar`} 
                />
              </div>
              {displayProject.client.verificationBadge && (
                <div className="verification-badge rotate-in" title="Verified Client">✓</div>
              )}
            </div>
            
            <div className="client-details">
              <h3 className="client-name">
                {displayProject.client.name}
              </h3>
              
              <div className="client-rating animate-sparkle">
                <div className="stars">
                  {renderStars(displayProject.client.rating)}
                </div>
                <span className="rating-text">
                  {displayProject.client.rating.toFixed(1)} 
                  <span className="reviews-count">({displayProject.client.totalReviews} reviews)</span>
                </span>
              </div>
              
              <div className="client-meta">
                {displayProject.client.memberSince && (
                  <div className="client-meta-item">
                    <span className="meta-icon">🗓️</span>
                    <span className="meta-label">Member since:</span>
                    <span className="meta-value">{displayProject.client.memberSince}</span>
                  </div>
                )}
                
                {displayProject.client.location && (
                  <div className="client-meta-item">
                    <span className="meta-icon">📍</span>
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{displayProject.client.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      )}
      
      <div className="apply-float-button">
        <button className="float-btn pulse-button" onClick={handleApply}>Apply Now</button>
      </div>
    </div>
  );
};

export default ProjectDetailPage;