import React from 'react';
import './FindJobCard.css';

const formatDate = (dateString) => {
  // Convert DD-MM-YY to a Date object
  const [day, month, year] = dateString.split('-');
  const date = new Date(`20${year}-${month}-${day}`); // Assuming 21st century (20xx)
  
  // Format to "Day Month Date Year"
  return date.toDateString();
};

const FindJobCard = ({ 
  image, 
  category, 
  postedDate,  // Expected in DD-MM-YY format
  description
}) => {
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