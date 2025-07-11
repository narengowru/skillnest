import React, { useState, useEffect, useContext } from "react";
import FindJobs from "./components/FindJobs";
import FindJobCard from "./components/FindJobCard";
import Filter from "./components/Filter";
import { jobAPI, freelancerAPI } from "./api/api"; // Import both APIs
import { UserContext } from "./components/UserContext"; // Import UserContext

const Jobs = () => {
  const { user } = useContext(UserContext); // Get user from UserContext
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [postedTimeline, setPostedTimeline] = useState(null);
  const [jobDuration, setJobDuration] = useState("All Durations");
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancerProfile, setFreelancerProfile] = useState(null);

  // Fetch freelancer profile data if user is a freelancer
  useEffect(() => {
    const fetchFreelancerProfile = async () => {
      if (user && user.userType === 'freelancer' && user.id) {
        try {
          const response = await freelancerAPI.getFreelancer(user.id);
          setFreelancerProfile(response.data);
        } catch (err) {
          console.error("Error fetching freelancer profile:", err);
          // Continue without freelancer profile data
        }
      }
    };

    fetchFreelancerProfile();
  }, [user]);

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

  // Function to check if a job matches freelancer's skills
  const isJobSuggested = (job) => {
    if (!freelancerProfile || !freelancerProfile.skills || !job.skills) {
      return false;
    }

    const freelancerSkills = freelancerProfile.skills.map(skill => 
      skill.name.toLowerCase()
    );
    const jobSkills = job.skills.map(skill => 
      skill.toLowerCase()
    );

    // Check if any of the freelancer's skills match the job's required skills
    return freelancerSkills.some(freelancerSkill => 
      jobSkills.some(jobSkill => 
        jobSkill.includes(freelancerSkill) || freelancerSkill.includes(jobSkill)
      )
    );
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

  // Separate suggested jobs from all jobs
  const suggestedJobs = filteredJobs.filter(job => isJobSuggested(job));
  const otherJobs = filteredJobs.filter(job => !isJobSuggested(job));

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

        <div style={{ flex: 1 }}>
          {/* Suggested Jobs Section */}
          {user && user.userType === 'freelancer' && freelancerProfile && (
            <>
              {suggestedJobs.length > 0 ? (
                <div style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    marginBottom: "20px", 
                    color: "#2c3e50", 
                    fontSize: "24px",
                    fontWeight: "600",
                    borderBottom: "2px solid #3498db",
                    paddingBottom: "10px"
                  }}>
                    🎯 Suggested for You
                    <span style={{ 
                      fontSize: "14px", 
                      color: "#7f8c8d", 
                      fontWeight: "400",
                      marginLeft: "10px"
                    }}>
                      Based on your skills: {freelancerProfile.skills?.map(skill => skill.name).join(", ")}
                    </span>
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                    alignItems: "start"
                  }}>
                    {suggestedJobs.map((job) => (
                      <FindJobCard
                        key={job._id}
                        id={job._id}
                        image={job.imageUrl}
                        category={job.category}
                        title={job.title}
                        postedDate={job.datePosted || job.createdAt}
                        description={job.description}
                      />
                    ))}
                  </div>
                </div>
              ) : freelancerProfile.skills && freelancerProfile.skills.length > 0 ? (
                <div style={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "20px",
                  color: "#856404"
                }}>
                  <strong>📝 No matches found:</strong> We couldn't find jobs that match your current skills. Try updating your skills in your profile or browse all available jobs below.
                </div>
              ) : (
                <div style={{
                  backgroundColor: "#d1ecf1",
                  border: "1px solid #bee5eb",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "20px",
                  color: "#0c5460"
                }}>
                  <strong>🎯 Add your skills:</strong> To see personalized job suggestions, please add your skills to your profile. You can do this by visiting your profile page.
                </div>
              )}
            </>
          )}

          {/* All Jobs Section */}
          <div>
            <h2 style={{ 
              marginBottom: "20px", 
              color: "#2c3e50", 
              fontSize: "24px",
              fontWeight: "600",
              borderBottom: "2px solid #e74c3c",
              paddingBottom: "10px"
            }}>
              📋 All Available Jobs
              {user && user.userType === 'freelancer' && suggestedJobs.length > 0 && (
                <span style={{ 
                  fontSize: "14px", 
                  color: "#7f8c8d", 
                  fontWeight: "400",
                  marginLeft: "10px"
                }}>
                  ({filteredJobs.length} total jobs)
                </span>
              )}
            </h2>
            
            {/* Info message for non-freelancers */}
            {(!user || user.userType !== 'freelancer') && (
              <div style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
                color: "#6c757d"
              }}>
                <strong>💡 Tip:</strong> Log in as a freelancer to see personalized job suggestions based on your skills!
              </div>
            )}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
              alignItems: "start",
              marginRight: "1px"
            }}>
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
      </div>
    </div>
  );
};

export default Jobs;