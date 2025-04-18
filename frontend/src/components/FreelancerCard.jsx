import React from 'react';
import PropTypes from 'prop-types';
import './FreelancerCard.css';

export default function FreelancerCard({
  id,
  name, 
  role, 
  rating, 
  hours, 
  price, 
  profileImage 
}) {
  const renderStars = (rating) => {
    // Convert rating to a number and ensure it's between 0-5
    const numRating = Number(rating) || 0;
    const safeRating = Math.min(Math.max(0, numRating), 5);
    
    return [...Array(5)].map((_, index) => (
      <span 
        key={index} 
        className={`star ${index < safeRating ? 'active' : ''}`}
      >
        ★
      </span>
    ));
  };

  // Handle missing or invalid price
  const displayPrice = () => {
    if (price === undefined || price === null || isNaN(price)) {
      return '$0.00';
    }
    try {
      return `$${Number(price).toLocaleString()}.00`;
    } catch (error) {
      console.error("Price formatting error:", error);
      return '$0.00';
    }
  };

  return (
    <div className="freelancer-card">
      <div className="card-title">{role || 'Freelancer'}</div>
      
      <div className="card-time-price">
        <span className="time">
          <i className="clock-icon">⏰</i> {hours || 0} hrs
        </span>
        <span className="price">{displayPrice()}</span>
      </div>
      
      <div className="card-profile">
        <div className="profile-image-container">
          <img 
            src={profileImage} 
            alt={`${name}'s profile`} 
            className="profile-image" 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
        </div>
        
        <div className="profile-details">
          <h3 className="profile-name">{name || 'Freelancer'}</h3>
          <div className="star-rating">{renderStars(rating)}</div>
        </div>
      </div>
      
      <div className="profile-actions">
        <button className="see-profile" onClick={() => window.location.href = `/freelancer/${id}`}>
          See Profile
        </button>
      </div>
      
      <button className="book-now">BOOK NOW</button>
    </div>
  );
}

FreelancerCard.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  role: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  hours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  profileImage: PropTypes.string,
};

FreelancerCard.defaultProps = {
  id: '',
  name: 'Freelancer',
  role: 'Professional',
  rating: 0,
  hours: 0,
  price: 0,
  profileImage: 'https://via.placeholder.com/150',
};