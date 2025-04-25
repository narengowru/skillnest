import React from "react";
import "./WhyChooseSkillnest.css";

const WhyChooseSkillnest = () => {
  return (
    <div className="why-choose-container">
      <div className="why-choose-content">
        <h2>Why Choose SkillNest?</h2>
        <p>
        SkillNest is a freelancing platform tailored for students and recent graduates, providing a bridge to real-world projects and opportunities. It connects student talent with businesses for short-term freelance work, offering features like skill-based profiles, project bidding, and portfolio showcasing. With student-focused tools and beginner-friendly job opportunities, SkillNest helps students build their skills, gain confidence, and kickstart their freelancing careers.
        </p>
      </div>
      <img 
        src="https://i.pinimg.com/736x/0d/e1/b7/0de1b7df683f00e0778c84246c684574.jpg" 
        alt="Freelancer Illustration" 
        className="why-choose-image"
      />
    </div>
  );
};

export default WhyChooseSkillnest;
