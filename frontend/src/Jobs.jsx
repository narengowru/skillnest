import React, { useState } from "react";
import FindJobs from "./components/FindJobs";
import FindJobCard from "./components/FindJobCard";
import Filter from "./components/Filter";
import jobData from "./jobData"; // Import job data

const Jobs = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [postedTimeline, setPostedTimeline] = useState(null);
  const [jobDuration, setJobDuration] = useState("All Durations");
  const [searchTerm, setSearchTerm] = useState(""); // State for search input

  // Function to handle search
  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
  };

  // Function to filter job data
  const filteredJobs = jobData
    .filter(job => 
      selectedCategories.length === 0 || selectedCategories.includes(job.category)
    )
    .filter(job => 
      jobDuration === "All Durations" || job.jobDuration === jobDuration
    )
    .filter(job => 
      searchTerm === "" || job.description.toLowerCase().includes(searchTerm) || job.category.toLowerCase().includes(searchTerm)
    )
    .sort((a, b) => {
      if (postedTimeline === "Newest First") {
        return new Date(b.postedDate) - new Date(a.postedDate);
      } else if (postedTimeline === "Oldest First") {
        return new Date(a.postedDate) - new Date(b.postedDate);
      }
      return 0; // No sorting applied if no timeline filter is selected
    });

  return (
    <div style={{ margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <FindJobs onSearch={handleSearch} /> {/* Pass onSearch function */}
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ width: "350px" }}>
          <Filter 
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            postedTimeline={postedTimeline}
            setPostedTimeline={setPostedTimeline}
            jobDuration={jobDuration}
            setJobDuration={setJobDuration}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            alignItems: "start",
            marginRight: "1px"
          }}
        >
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <FindJobCard
                key={index}
                image={job.image}
                category={job.category}
                postedDate={job.postedDate}
                description={job.description}
              />
            ))
          ) : (
            <p>No jobs match the selected filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
