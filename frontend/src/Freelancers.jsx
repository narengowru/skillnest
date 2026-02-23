import React, { useState, useEffect, useContext } from "react";
import FindFreelancer from "./components/FindFreeLancer";
import FreelancerCard from "./components/FreelancerCard";
import { freelancerAPI, clientAPI, recommendationAPI } from "./api/api";
import { UserContext } from "./components/UserContext";

const Freelancers = () => {
  const { user } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);

  // Debug logging
  console.log("🔍 Freelancers Component - User:", user);
  console.log("🔍 Recommendations:", recommendations);
  console.log("🔍 Loading Recommendations:", loadingRecommendations);

  // Fetch all freelancers
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const response = await freelancerAPI.getAllFreelancers();
        // Filter to only include verified freelancers
        const verifiedFreelancers = response.data.filter(freelancer =>
          freelancer.isVerified === true
        );
        setFreelancers(verifiedFreelancers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching freelancers:", err);
        setError("Failed to load freelancers. Please try again later.");
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  // Fetch client profile if user is a client
  useEffect(() => {
    const fetchClientProfile = async () => {
      if (user && user.userType === 'client' && user.id) {
        try {
          const response = await clientAPI.getClient(user.id);
          setClientProfile(response.data);
        } catch (err) {
          console.error("Error fetching client profile:", err);
        }
      }
    };
    fetchClientProfile();
  }, [user]);

  // Fetch ML-based recommendations for clients
  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log("🎯 Checking if should fetch recommendations...");
      console.log("   User exists:", !!user);
      console.log("   User type:", user?.userType);
      console.log("   User ID:", user?.id);

      if (user && user.userType === 'client' && user.id) {
        console.log("✅ Fetching recommendations for client:", user.id);
        try {
          setLoadingRecommendations(true);
          const response = await recommendationAPI.getFreelancerRecommendations(user.id, {
            limit: 10,
            minScore: 50  // Only show freelancers with >50% match
          });

          console.log("📦 Freelancer Recommendations response:", response);

          if (response && response.data && response.data.data && response.data.data.recommendations) {
            setRecommendations(response.data.data.recommendations);
            console.log("✅ SET RECOMMENDATIONS:", response.data.data.recommendations);
            console.log("✅ RECOMMENDATIONS LENGTH:", response.data.data.recommendations.length);
          } else {
            console.log("❌ No recommendations found");
          }
        } catch (err) {
          console.error("❌ Error fetching recommendations:", err);
          console.error("   Error details:", err.response?.data || err.message);
        } finally {
          setLoadingRecommendations(false);
        }
      } else {
        console.log("⏭️ Skipping recommendations fetch - not a logged-in client");
      }
    };

    fetchRecommendations();
  }, [user]);

  // Filter freelancers by search term
  const filteredFreelancers = freelancers.filter((freelancer) =>
    freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter recommendations by search term
  const filteredRecommendations = recommendations.filter((rec) =>
    rec.freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.freelancer.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get non-recommended freelancers (exclude those in recommendations)
  const recommendedIds = new Set(recommendations.map(rec => rec.freelancer._id));
  const filteredOthers = filteredFreelancers.filter(
    freelancer => !recommendedIds.has(freelancer._id)
  );

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <FindFreelancer onSearch={setSearchTerm} />

      {loading ? (
        <div style={{ margin: "50px auto" }}>Loading freelancers...</div>
      ) : error ? (
        <div id="search-results" style={{ margin: "50px auto", color: "red" }}>{error}</div>
      ) : (
        <>
          {/* Recommended Freelancers Section - Using ML Algorithm */}
          {user && user.userType === 'client' && (
            <>
              {loadingRecommendations ? (
                <div style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#7f8c8d"
                }}>
                  Loading personalized recommendations...
                </div>
              ) : filteredRecommendations.length > 0 ? (
                <div style={{ marginBottom: "40px" }}>
                  <h2 style={{
                    marginBottom: "20px",
                    color: "#2c3e50",
                    fontSize: "24px",
                    fontWeight: "600",
                    borderBottom: "2px solid #3498db",
                    paddingBottom: "10px"
                  }}>
                    ⭐ Recommended for Your Projects
                    <span style={{
                      fontSize: "14px",
                      color: "#7f8c8d",
                      fontWeight: "400",
                      marginLeft: "10px"
                    }}>
                      Powered by AI • Based on your job requirements and hiring history
                    </span>
                  </h2>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "120px",
                    justifyContent: "center",
                    padding: "30px",
                    margin: "30px auto",
                    maxWidth: "1200px",
                  }}>
                    {filteredRecommendations.map((rec) => (
                      <div key={rec.freelancer._id} style={{ position: "relative" }}>
                        {/* Match Score Badge */}
                        <div style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: rec.matchScore >= 70 ? "#27ae60" : rec.matchScore >= 50 ? "#f39c12" : "#3498db",
                          color: "white",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: "700",
                          zIndex: 100,
                          boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
                          border: "2px solid white"
                        }}>
                          {rec.matchScore}% Match
                        </div>

                        <FreelancerCard
                          id={rec.freelancer._id}
                          name={rec.freelancer.name}
                          role={rec.freelancer.tagline}
                          rating={rec.freelancer.ratings?.average || 0}
                          hours={rec.freelancer.availability?.hoursPerWeek || 0}
                          price={rec.freelancer.hourlyRate ? parseInt(rec.freelancer.hourlyRate.replace(/[^0-9]/g, '')) : 0}
                          profileImage={rec.freelancer.profilePhoto || 'https://via.placeholder.com/150'}
                        />

                        {/* Match Reasons */}
                        {rec.matchReasons && rec.matchReasons.length > 0 && (
                          <div style={{
                            marginTop: "10px",
                            padding: "10px",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            fontSize: "12px",
                            color: "#555",
                            textAlign: "left"
                          }}>
                            <strong>Why recommended:</strong>
                            <ul style={{ margin: "5px 0 0 0", paddingLeft: "20px" }}>
                              {rec.matchReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : clientProfile ? (
                <div style={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "20px",
                  color: "#856404"
                }}>
                  <strong>📝 Building your recommendations:</strong> Post jobs with skill requirements to get AI-powered freelancer suggestions tailored to your needs!
                </div>
              ) : null}
            </>
          )}

          {/* All/Other Freelancers Section */}
          <div>
            <h2 style={{
              marginBottom: "20px",
              color: "#2c3e50",
              fontSize: "24px",
              fontWeight: "600",
              borderBottom: "2px solid #e74c3c",
              paddingBottom: "10px"
            }}>
              📋 All Available Freelancers
              {user && user.userType === 'client' && filteredRecommendations.length > 0 && (
                <span style={{
                  fontSize: "14px",
                  color: "#7f8c8d",
                  fontWeight: "400",
                  marginLeft: "10px"
                }}>
                  ({filteredOthers.length} other freelancers)
                </span>
              )}
            </h2>

            {/* Info message for non-clients */}
            {(!user || user.userType !== 'client') && (
              <div style={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
                color: "#6c757d"
              }}>
                <strong>💡 Tip:</strong> Log in as a client to see personalized freelancer recommendations based on your job requirements!
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "60px",
                justifyContent: "center",
                padding: "50px",
                margin: "50px auto",
                maxWidth: "1200px",
              }}
            >
              {filteredOthers.length > 0 ? (
                filteredOthers.map((freelancer) => (
                  <FreelancerCard
                    key={freelancer._id}
                    id={freelancer._id}
                    name={freelancer.name}
                    role={freelancer.tagline}
                    rating={freelancer.ratings?.average || 0}
                    hours={freelancer.availability?.hoursPerWeek || 0}
                    price={freelancer.hourlyRate ? parseInt(freelancer.hourlyRate.replace(/[^0-9]/g, '')) : 0}
                    profileImage={freelancer.profilePhoto || 'https://via.placeholder.com/150'}
                  />
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                  No verified freelancers found matching your search criteria.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Freelancers;