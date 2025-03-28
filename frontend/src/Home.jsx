import React from "react";
import Carousel from "./components/Carousel"; // Adjust path if needed
import WhyChooseSkillnest from "./components/WhyChooseSkillnest";
import Reviews from "./components/Reviews";
import FreelancersSpecialty from "./components/FreelancersSpecialty";

const Home = () => {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={{
        marginBottom: '40px'
      }}><Carousel />  {/* Add carousel here */}
      </div>
      <WhyChooseSkillnest />
      <Reviews />
      <FreelancersSpecialty />

      
    </div>
  );
};

export default Home;
