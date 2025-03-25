import React, { useState } from "react"; 
import FindFreelancer from "./components/FindFreeLancer";
import FreelancerCard from "./components/FreelancerCard";
import Lancers from "./Lancers"; // Importing the Lancers array

const Freelancers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Function to filter freelancers based on search
  const filteredLancers = Lancers.filter((lancer) =>
    lancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lancer.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <FindFreelancer onSearch={setSearchTerm} /> {/* Pass search function */}

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "60px", 
        justifyContent: "center", 
        padding: "50px", 
        margin: "50px auto", 
        maxWidth: "1200px"  
      }}>
        {filteredLancers.map((freelancer, index) => (
          <FreelancerCard key={index} {...freelancer} />
        ))}
      </div>
    </div>
  );
};

export default Freelancers;
