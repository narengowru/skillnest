import React from 'react';
import PropTypes from 'prop-types';

// Inline styles for the card — drop FreelancerCard.css import or override in it
// If you prefer a separate CSS file, copy the <style> block below into FreelancerCard.css

const styles = `
  .fc-card {
    position: relative;
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: hidden;
    text-align: left;
  }
  .fc-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  .fc-card:focus-visible {
    outline: 2px solid #4f6ef7;
    outline-offset: 2px;
  }

  /* Match badge — sits inside the card, top-right */
  .fc-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: #fff;
  }
  .fc-badge--high   { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .fc-badge--mid    { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .fc-badge--normal { background: linear-gradient(135deg, #4f6ef7, #3b56e0); }

  /* Top row: avatar + name + role */
  .fc-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .fc-avatar-wrap {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #f0f0f0;
  }
  .fc-avatar-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .fc-identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .fc-name {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
  }
  .fc-role {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Divider */
  .fc-divider {
    height: 1px;
    background: #f3f4f6;
    margin: 0;
  }

  /* Stats row */
  .fc-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .fc-price {
    font-size: 17px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.4px;
  }
  .fc-price span {
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
    letter-spacing: 0;
    margin-left: 2px;
  }
  .fc-stars {
    display: flex;
    gap: 2px;
  }
  .fc-star {
    font-size: 13px;
    color: #d1d5db;
    line-height: 1;
    transition: color 0.1s;
  }
  .fc-star--active {
    color: #f59e0b;
  }

  /* CTA row */
  .fc-actions {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }
  .fc-btn-secondary {
    flex: 1;
    padding: 9px 0;
    border-radius: 10px;
    border: 1.5px solid #e5e7eb;
    background: transparent;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .fc-btn-secondary:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  .fc-btn-primary {
    flex: 1.4;
    padding: 9px 0;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #4f6ef7 0%, #3b56e0 100%);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 2px 8px rgba(79, 110, 247, 0.30);
  }
  .fc-btn-primary:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
`;

export default function FreelancerCard({
  id,
  name,
  role,
  rating,
  hours,
  price,
  profileImage,
  matchScore,       // new optional prop: pass from Freelancers.jsx
  matchReasons,     // new optional prop (unused visually but kept for parity)
}) {
  const renderStars = (rating) => {
    const n = Math.min(Math.max(0, Number(rating) || 0), 5);
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`fc-star${i < n ? ' fc-star--active' : ''}`}>★</span>
    ));
  };

  const displayPrice = () => {
    if (price === undefined || price === null || isNaN(price)) return '$0';
    return `$${Number(price).toLocaleString()}`;
  };

  const handleRedirect = () => {
    window.location.href = `/view-profile/${id}`;
  };

  const badgeClass =
    matchScore >= 70 ? 'fc-badge fc-badge--high'
      : matchScore >= 50 ? 'fc-badge fc-badge--mid'
        : 'fc-badge fc-badge--normal';

  return (
    <>
      <style>{styles}</style>
      <div
        className="fc-card"
        onClick={handleRedirect}
        onKeyDown={(e) => e.key === 'Enter' && handleRedirect()}
        role="button"
        tabIndex={0}
      >
        {/* Match badge — inside card */}
        {matchScore !== undefined && matchScore !== null && (
          <div className={badgeClass}>{matchScore}% Match</div>
        )}

        {/* Header: avatar + name + role */}
        <div className="fc-header">
          <div className="fc-avatar-wrap">
            <img
              src={profileImage}
              alt={`${name}'s profile`}
              onError={(e) => { e.target.src = 'https://i.ibb.co/N6GPXKSt/blank.jpg'; }}
            />
          </div>
          <div className="fc-identity">
            <h3 className="fc-name">{name || 'Freelancer'}</h3>
            <span className="fc-role">{role || 'Professional'}</span>
          </div>
        </div>

        <div className="fc-divider" />

        {/* Price + Stars */}
        <div className="fc-stats">
          <div className="fc-price">
            {displayPrice()}<span>/hr</span>
          </div>
          <div className="fc-stars">{renderStars(rating)}</div>
        </div>

        {/* CTAs */}
        <div className="fc-actions">
          <button
            className="fc-btn-secondary"
            onClick={(e) => { e.stopPropagation(); handleRedirect(); }}
          >
            Profile
          </button>
          <button
            className="fc-btn-primary"
            onClick={(e) => { e.stopPropagation(); handleRedirect(); }}
          >
            Book Now
          </button>
        </div>
      </div>
    </>
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
  matchScore: PropTypes.number,
  matchReasons: PropTypes.arrayOf(PropTypes.string),
};

FreelancerCard.defaultProps = {
  id: '',
  name: 'Freelancer',
  role: 'Professional',
  rating: 0,
  hours: 0,
  price: 0,
  profileImage: 'https://i.ibb.co/N6GPXKSt/blank.jpg',
};