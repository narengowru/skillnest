import React from 'react';
import PropTypes from 'prop-types';
import './FreelancerCard.css';

export default function FreelancerCard({
  name, 
  role, 
  rating, 
  hours, 
  price, 
  profileImage 
}) {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span 
        key={index} 
        className={`star ${index < rating ? 'active' : ''}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="freelancer-card">
      <div className="card-title">{role}</div>
      
      <div className="card-time-price">
        <span className="time">
          <i className="clock-icon">⏰</i> {hours} hrs
        </span>
        <span className="price">₹{price.toLocaleString()}.00</span>
      </div>
      
      <div className="card-profile">
        <div className="profile-image-container">
          <img 
            src={profileImage} 
            alt={`${name}'s profile`} 
            className="profile-image" 
          />
        </div>
        
        <div className="profile-details">
          <h3 className="profile-name">{name}</h3>
          <div className="star-rating">{renderStars(rating)}</div>
        </div>
      </div>
      
      <div className="profile-actions">
        <button className="see-profile">See Profile</button>
        
      </div>
      
      
      
      <button className="book-now">BOOK NOW</button>
    </div>
  );
}

FreelancerCard.propTypes = {
  name: PropTypes.string,
  role: PropTypes.string,
  rating: PropTypes.number,
  hours: PropTypes.number,
  price: PropTypes.number,
  profileImage: PropTypes.string,
};

FreelancerCard.defaultProps = {
  name: 'Jake Paul',
  role: 'Video Editor',
  rating: 4,
  hours: 3,
  price: 2000,
  profileImage: 'https://via.placeholder.com/150',
};
