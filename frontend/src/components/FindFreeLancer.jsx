import React, { useState } from 'react';
import './FindFreeLancer.css';

const FindFreeLancer = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for freelancer:', searchTerm);
  };

  return (
    <div className="find-freelancer-container">
      <div className="find-freelancer-overlay">
        <div className="find-freelancer-content">
          <h1 className="find-freelancer-title">Find Freelancer</h1>
          <p className="find-freelancer-subtitle">Want Your work done, We got your back!!</p>
          
          <form onSubmit={handleSearch} className="find-freelancer-search">
            <input 
              type="text" 
              placeholder="Find FindFreelancer" 
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