import React from "react";
import Carousel from "./components/Carousel"; // Adjust path if needed
import WhyChooseSkillnest from "./components/WhyChooseSkillnest";
import Reviews from "./components/Reviews";
import FreelancersSpecialty from "./components/FreelancersSpecialty";
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/post-project');
  };
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={{
        marginBottom: '40px'
      }}><Carousel />  {/* Add carousel here */}
      </div>
      <WhyChooseSkillnest />
      <Reviews />
      <FreelancersSpecialty />

      <div 
      onClick={handleClick}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 30px',
        backgroundColor: '#ff6b6b',
        backgroundImage: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
        color: 'white',
        fontWeight: '700',
        fontSize: '18px',
        borderRadius: '12px',
        boxShadow: '0 10px 20px rgba(255, 107, 107, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        maxWidth: '300px',
        margin: '40px auto',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 15px 25px rgba(255, 107, 107, 0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(255, 107, 107, 0.25)';
      }}
    >
      <span 
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ verticalAlign: 'middle' }}
        >
          <path 
            d="M12 5V19M5 12H19" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        Post a Job
      </span>
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
          transform: 'scale(0)',
          transformOrigin: 'center',
          transition: 'transform 0.5s ease-out',
          zIndex: 1
        }}
        className="ripple-effect"
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(3)';
          setTimeout(() => {
            if (e.currentTarget) {
              e.currentTarget.style.transform = 'scale(0)';
            }
          }, 500);
        }}
      />
    </div>
    </div>
  );
};

export default Home;
