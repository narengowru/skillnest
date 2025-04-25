import React, { useState, useEffect } from "react";
import FindFreelancer from "./components/FindFreeLancer";
import FreelancerCard from "./components/FreelancerCard";
import { freelancerAPI } from "./api/api"; // Import the freelancer API functions

const Freelancers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Function to filter freelancers based on search
  const filteredFreelancers = freelancers.filter((freelancer) =>
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
          {filteredFreelancers.length > 0 ? (
            filteredFreelancers.map((freelancer) => (
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
      )}
    </div>
  );
};

export default Freelancers;