import React from 'react';
import './FindJobCard.css';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString) => {
  const dateParts = dateString.split('-'); // Assuming DD-MM-YY
  const formattedDate = new Date(`20${dateParts[2]}`, dateParts[1] - 1, dateParts[0]);
  return formattedDate.toDateString(); // Example: "Mon Jan 29 2024"
};

const FindJobCard = ({ 
  id,
  image, 
  category, 
  postedDate,  // Expected in DD-MM-YY format
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
