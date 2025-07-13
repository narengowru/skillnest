import React, { useState } from 'react';
import '../css/FindFreeLancer.css';

const FindFreeLancer = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  
    // Smooth scroll down by 300px
    setTimeout(() => {
      window.scrollBy({
        top: 650, // scrolls down 300px
        behavior: "smooth"
      });
    }, 100);
  };

  return (
    <div className="find-freelancer-container">
      <div className="find-freelancer-overlay">
        <div className="find-freelancer-content">
          <h1 className="find-freelancer-title">Find Freelancer</h1>
          <p className="find-freelancer-subtitle">Want your work done? We got your back!</p>
          
          <form onSubmit={handleSearch} className="find-freelancer-search">
            <input 
              type="text" 
              placeholder="Find Freelancer" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="find-freelancer-input"
            />
            <button type="submit" className="find-freelancer-button">
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FindFreeLancer;
