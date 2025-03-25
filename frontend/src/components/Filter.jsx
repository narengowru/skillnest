import React from "react";
import "./Filter.css";

const Filter = ({ 
  selectedCategories, setSelectedCategories, 
  postedTimeline, setPostedTimeline, 
  jobDuration, setJobDuration 
}) => {
  const categories = [
    "Writing & Translation",
    "Programming & Development",
    "Administrative & Secretarial",
    "Design & Art",
    "Business & Finance",
    "Sales & Marketing",
    "Others"
  ];

  const jobDurations = [
    "All Durations",
    "Less than a week",
    "1-2 weeks",
    "2-4 weeks",
    "1-3 months",
    "3-6 months",
    "More than 6 months"
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTimelineChange = (timeline) => {
    setPostedTimeline(timeline);
  };

  const handleJobDurationChange = (duration) => {
    console.log("Selected Duration:", duration); // Debugging
    setJobDuration(duration);
  };
  

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPostedTimeline(null);
    setJobDuration("All Durations");
  };

  return (
    <div className="filter-container">
      <div className="filter-header">
        <span className="red-line"></span>
        <h2>Filter by:</h2>
      </div>

      <div className="filter-section">
        <div className="category-filter">
          <div className="filter-subheader">
            <span className="red-line"></span>
            <h3>Category</h3>
          </div>
          <div className="category-options">
            {categories.map((category) => (
              <label key={category} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <span className="checkmark"></span>
                {category}
              </label>
            ))}
          </div>
        </div>

        <div className="timeline-filter">
          <div className="filter-subheader">
            <span className="red-line"></span>
            <h3>Posted Timeline</h3>
          </div>
          <div className="timeline-options">
            {["Newest First", "Oldest First"].map((timeline) => (
              <label key={timeline} className="radio-wrapper">
                <input
                  type="radio"
                  name="timeline"
                  checked={postedTimeline === timeline}
                  onChange={() => handleTimelineChange(timeline)}
                />
                <span className="radiomark"></span>
                {timeline}
              </label>
            ))}
          </div>
        </div>

        <div className="duration-filter">
          <div className="filter-subheader">
            <span className="red-line"></span>
            <h3>Job Duration</h3>
          </div>
          <select 
            value={jobDuration} 
            onChange={(e) => handleJobDurationChange(e.target.value)}
            className="duration-select"
          >
            {jobDurations.map((duration) => (
              <option key={duration} value={duration}>
                {duration}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="clear-filters-btn"
          onClick={clearAllFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default Filter;
