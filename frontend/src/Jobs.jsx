import React, { useState, useEffect, useContext } from "react";
import FindJobs from "./components/FindJobs";
import FindJobCard from "./components/FindJobCard";
import Filter from "./components/Filter";
import { jobAPI, freelancerAPI, recommendationAPI } from "./api/api"; // Import recommendation API
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
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  // Fetch personalized recommendations for freelancers
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user && user.userType === 'freelancer' && user.id) {
        try {
          setLoadingRecommendations(true);
          const response = await recommendationAPI.getJobRecommendations(user.id, {
            limit: 10,
            excludeApplied: true,
            minScore: 0
          });

          console.log("Recommendations response:", response);

          // Fix: Access recommendations from response.data.data.recommendations
          if (response && response.data && response.data.data && response.data.data.recommendations) {
            setRecommendations(response.data.data.recommendations);
            console.log("✅ SET RECOMMENDATIONS:", response.data.data.recommendations);
            console.log("✅ RECOMMENDATIONS LENGTH:", response.data.data.recommendations.length);
          } else {
            console.log("❌ No recommendations found");
          }
        } catch (err) {
          console.error("Error fetching recommendations:", err);
          // Continue without recommendations
        } finally {
          setLoadingRecommendations(false);
        }
      }
    };

    fetchRecommendations();
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
        return new Date(a.datePosted || a.createdAt) - new Date(b.datePosted || a.createdAt);
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

        <div style={{ flex: 1 }}>
          {/* Recommended Jobs Section - Using ML Algorithm */}
          {user && user.userType === 'freelancer' && (
            <>
              {loadingRecommendations ? (
                <div style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#7f8c8d"
                }}>
                  Loading personalized recommendations...
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ marginBottom: "40px" }}>
                  <h2 style={{
                    marginBottom: "20px",
                    color: "#2c3e50",
                    fontSize: "24px",
                    fontWeight: "600",
                    borderBottom: "2px solid #3498db",
                    paddingBottom: "10px"
                  }}>
                    🎯 Recommended for You
                    <span style={{
                      fontSize: "14px",
                      color: "#7f8c8d",
                      fontWeight: "400",
                      marginLeft: "10px"
                    }}>
                      Powered by AI • Based on your profile and application history
                    </span>
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                    alignItems: "start"
                  }}>
                    {recommendations.map((rec) => (
                      <div key={rec.job._id} style={{ position: "relative" }}>
                        {/* Match Score Badge */}
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: rec.matchScore >= 70 ? "#27ae60" : rec.matchScore >= 50 ? "#f39c12" : "#3498db",
                          color: "white",
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          zIndex: 10,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          {rec.matchScore}% Match
                        </div>

                        <FindJobCard
                          id={rec.job._id}
                          image={rec.job.imageUrl}
                          category={rec.job.category}
                          title={rec.job.title}
                          postedDate={rec.job.datePosted || rec.job.createdAt}
                          description={rec.job.description}
                        />

                        {/* Match Reasons - Temporarily Commented Out */}
                        {/* {rec.matchReasons && rec.matchReasons.length > 0 && (
                          <div style={{
                            marginTop: "-10px",
                            padding: "10px",
                            background: "#f8f9fa",
                            borderRadius: "0 0 8px 8px",
                            fontSize: "12px",
                            color: "#555"
                          }}>
                            <strong>Why recommended:</strong>
                            <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px" }}>
                              {rec.matchReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )} */}
                      </div>
                    ))}
                  </div>
                </div>
              ) : freelancerProfile && freelancerProfile.skills && freelancerProfile.skills.length > 0 ? (
                <div style={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "20px",
                  color: "#856404"
                }}>
                  <strong>📝 Building your recommendations:</strong> We're analyzing jobs that match your skills. Check back soon or browse all available jobs below.
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
                  <strong>🎯 Get personalized recommendations:</strong> Add your skills to your profile to see AI-powered job suggestions tailored just for you!
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
              {user && user.userType === 'freelancer' && recommendations.length > 0 && (
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