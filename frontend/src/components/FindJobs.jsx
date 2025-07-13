import React, { useState } from 'react';
import '../css/FindJobs.css';

const FindJobs = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm); // Send search term to parent
  };

  return (
    <div className="find-jobs-container">
      <div className="find-jobs-overlay">
        <div className="find-jobs-content">
          <h1 className="find-jobs-title">Find Jobs</h1>
          <p className="find-jobs-subtitle">The Best Place where you can find jobs</p>
          
          <form onSubmit={handleSearch} className="find-jobs-search">
            <input 
              type="text" 
              placeholder="Find Jobs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="find-jobs-input"
            />
            <button type="submit" className="find-jobs-button">
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FindJobs;
