import React from "react";
import "./WhyChooseSkillnest.css";

const WhyChooseSkillnest = () => {
  return (
    <div className="why-choose-container">
      <div className="why-choose-content">
        <h2>Why Choose SkillNest?</h2>
        <p>
          Working for yourself has several advantages, whether you do it by founding your own
          company or by accepting numerous assignments as a freelancer. Flexibility, freedom of
          choice in projects and clients, and financial potential are all benefits of working as a
          freelancer. Many people in a variety of professions like to be their own boss, and freelancing is the simplest way to do so.
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
