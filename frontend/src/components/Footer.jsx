import React from 'react';
import '../css/Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="footer-logo">SkillNest</h2>
          <div className="footer-contact-info">
            
            <div className="contact-item">
              <i className="icon-phone"></i>
              <span>+91 9876543210</span>
            </div>
            <div className="contact-item">
              <i className="icon-email"></i>
              <span>admin@skillnest.com</span>
            </div>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h3>Explore</h3>
            <ul>
              <li><a href="#">About Us</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © SkillNest. All rights reserved!</p>
      </div>
    </footer>
  );
};

export default Footer;