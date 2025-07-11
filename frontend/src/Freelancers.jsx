import React, { useState, useEffect } from "react";
import FindFreelancer from "./components/FindFreeLancer";
import FreelancerCard from "./components/FreelancerCard";
import { freelancerAPI } from "./api/api"; // Import the freelancer API functions
import { clientAPI } from "./api/api"; // Import the client API functions

const Freelancers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedFreelancers, setRecommendedFreelancers] = useState([]);
  const [otherFreelancers, setOtherFreelancers] = useState([]);

  // Fetch freelancers from the API when the component mounts
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

  // Recommendation logic for clients
  useEffect(() => {
    const recommendFreelancers = async () => {
      const userString = localStorage.getItem('user');
      if (!userString) return;
      const user = JSON.parse(userString);
      if (!user.isLoggedIn || user.userType !== 'client') return;
      try {
        // 1. Get client ID
        const clientsRes = await clientAPI.getAllClients();
        const matchingClient = clientsRes.data.find(client => client.email === user.email);
        if (!matchingClient) return;
        const clientId = matchingClient._id;
        // 2. Fetch all jobs
        const jobsRes = await freelancerAPI.getAllFreelancers().then(() => import('./api/api').then(m => m.jobAPI.getAllJobs()));
        const allJobs = jobsRes.data;
        // 3. Filter jobs for this client
        const clientJobs = allJobs.filter(job => {
          // job.client can be an object or string
          if (!job.client) return false;
          if (typeof job.client === 'string') return job.client === clientId;
          if (typeof job.client === 'object' && job.client._id) return job.client._id === clientId;
          if (job.clientId) return job.clientId === clientId;
          return false;
        });
        // 4. Extract all required skills from these jobs
        const jobSkills = clientJobs.flatMap(job => Array.isArray(job.skills) ? job.skills : []).map(skill => (typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()));
        const uniqueJobSkills = Array.from(new Set(jobSkills));
        console.log('Client Jobs:', clientJobs);
        console.log('Extracted Job Skills:', uniqueJobSkills);
        // 5. Match freelancers
        const recommended = [];
        const others = [];
        freelancers.forEach(freelancer => {
          const freelancerSkills = Array.isArray(freelancer.skills) ? freelancer.skills.map(s => (s.name ? s.name.toLowerCase() : String(s).toLowerCase())) : [];
          console.log(`Freelancer ${freelancer.name} skills:`, freelancerSkills);
          const matches = uniqueJobSkills.some(skill => freelancerSkills.includes(skill));
          if (matches) recommended.push(freelancer);
          else others.push(freelancer);
        });
        console.log('Recommended Freelancers:', recommended.map(f => f.name));
        console.log('Other Freelancers:', others.map(f => f.name));
        setRecommendedFreelancers(recommended);
        setOtherFreelancers(others);
      } catch (err) {
        // If any error, just show all freelancers as usual
        setRecommendedFreelancers([]);
        setOtherFreelancers(freelancers);
      }
    };
    if (freelancers.length > 0) recommendFreelancers();
  }, [freelancers]);

  // Function to filter freelancers based on search
  const filteredFreelancers = freelancers.filter((freelancer) =>
    freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter recommended and other freelancers by search term
  const filteredRecommended = recommendedFreelancers.filter((freelancer) =>
    freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredOthers = otherFreelancers.filter((freelancer) =>
    freelancer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <FindFreelancer onSearch={setSearchTerm} />

      {loading ? (
        <div style={{ margin: "50px auto" }}>Loading freelancers...</div>
      ) : error ? (
        <div id  ="search-results" style={{ margin: "50px auto", color: "red" }}>{error}</div>
      ) : (
        <>
          {/* Recommended Freelancers Section */}
          {filteredRecommended.length > 0 && (
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ color: "#2c3e50", fontSize: "24px", fontWeight: "600", borderBottom: "2px solid #3498db", paddingBottom: "10px" }}>
                ⭐ Recommended for Your Jobs
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "60px",
                  justifyContent: "center",
                  padding: "30px",
                  margin: "30px auto",
                  maxWidth: "1200px",
                }}
              >
                {filteredRecommended.map((freelancer) => (
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
                ))}
              </div>
            </div>
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
              {filteredRecommended.length > 0 && (
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
            {(() => {
              const userString = localStorage.getItem('user');
              if (!userString) return null;
              const user = JSON.parse(userString);
              if (user.userType !== 'client') {
                return (
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
                );
              }
              return null;
            })()}
            
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
              {(filteredRecommended.length > 0 || filteredOthers.length > 0) ? (
                [...filteredRecommended, ...filteredOthers].map((freelancer) => (
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