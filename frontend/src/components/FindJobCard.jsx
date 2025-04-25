import React from 'react';
import './FindJobCard.css';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString) => {
  try {
    // Parse ISO date string (e.g., "2025-04-23T16:52:29.932Z")
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Return formatted date string
    return date.toDateString(); // Example: "Wed Apr 23 2025"
  } catch (error) {
    return 'Invalid date';
  }
};

const FindJobCard = ({ 
  id,
  image, 
  category, 
  postedDate,  // ISO format date string: "2025-04-23T16:52:29.932Z"
  description
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/details/${id}`);
  };

  return (
    <div className="find-job-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="find-job-card-image-container">
        <img 
          src={image} 
          alt="Job Category" 
          className="find-job-card-image"
        />
      </div>
      <div className="find-job-card-category">
        {category}
      </div>
      <div className="find-job-card-date">
        Posted on: {formatDate(postedDate)}
      </div>
      <div className="find-job-card-description">
        {description}
      </div>
    </div>
  );
};

export default FindJobCard;