import React from 'react';
import './FindJobCard.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toDateString(); // Example: "Mon Jan 29 2024"
};

const FindJobCard = ({ 
  image, 
  category, 
  postedDate,  // Expected in DD-MM-YY format
  description
}) => {
  console.log(postedDate);
  return (
    <div className="find-job-card">
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