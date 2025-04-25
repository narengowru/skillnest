import React, { useState, useEffect } from "react";
import FindJobs from "./components/FindJobs";
import FindJobCard from "./components/FindJobCard";
import Filter from "./components/Filter";
import { jobAPI } from "./api/api"; // Import the API service

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [postedTimeline, setPostedTimeline] = useState(null);
  const [jobDuration, setJobDuration] = useState("All Durations");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobAPI.getAllJobs();
        
        console.log("Full API Response:", response);
        
        if (response && response.data) {
          setJobs(response.data);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
        // Use mock data during development if API fails
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Function to handle search
  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
    setTimeout(() => {
      const element = document.getElementById("search-results");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100); // slight delay ensures any render changes finish first
  };

  // Function to filter job data based on updated schema with category field
  const filteredJobs = jobs
    .filter(job =>
      selectedCategories.length === 0 || 
      (job.category && selectedCategories.includes(job.category))
    )
    .filter(job =>
      jobDuration === "All Durations" || 
      (job.projectDuration && job.projectDuration.includes(jobDuration))
    )
    .filter(job =>
      searchTerm === "" || 
      (job.description && job.description.toLowerCase().includes(searchTerm)) || 
      (job.title && job.title.toLowerCase().includes(searchTerm))
    )
    .sort((a, b) => {
      if (postedTimeline === "Newest First") {
        return new Date(b.datePosted || b.createdAt) - new Date(a.datePosted || a.createdAt);
      } else if (postedTimeline === "Oldest First") {
        return new Date(a.datePosted || a.createdAt) - new Date(b.datePosted || b.createdAt);
      }
      return 0;
    });

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <FindJobs onSearch={handleSearch} />
      </div>

      <div id="search-results" style={{ display: "flex", gap: "20px" }}>
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
            filteredJobs.map((job) => (
              <FindJobCard
                key={job._id}
                id={job._id}
                image={job.imageUrl}
                category={job.category}
                title={job.title}
                postedDate={job.datePosted || job.createdAt}
                description={job.description}
              />
            ))
          ) : (
            <p>No jobs found. Please try different filters or check back later.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;