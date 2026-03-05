import React from 'react';
import '../css/FindJobCard.css';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

const FindJobCard = ({
  id,
  image,
  category,
  title,
  postedDate,
  description,
  onApply   // if provided, shows the Apply Now button (freelancers only)
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/details/${id}`);
  };

  const handleApplyClick = (e) => {
    e.stopPropagation(); // prevent navigating to job details
    if (onApply) onApply();
  };

  return (
    <div className="find-job-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
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
      {title && (
        <div className="find-job-card-title">
          {title}
        </div>
      )}
      <div className="find-job-card-date">
        Posted on: {formatDate(postedDate)}
      </div>
      <div className="find-job-card-description">
        {description}
      </div>
      {onApply && (
        <div className="find-job-card-footer">
          <button className="apply-now-btn" onClick={handleApplyClick}>
            ✉ Apply Now
          </button>
        </div>
      )}
    </div>
  );
};

export default FindJobCard;