import React from 'react';
import './FreelancersSpecialty.css';

const FreelancersSpecialty = () => {
  const specialtyItems = [
    {
      id: 1,
      title: 'Post a Job',
      description: 'A job posting is defined as an official advertisement created by the employer, human resources, or a recruiter to alert existing employees or job seekers regarding a job opening within the company.',
      color: '#FF6B6B'
    },
    {
      id: 2,
      title: 'Choose Freelancers',
      description: 'No job is too big or too small. We\'ve got freelancers for job of any size or budget with extra-ordinary skill. No job is complex. We can get it done!',
      color: '#4ECDC4'
    },
    // {
    //   id: 3,
    //   title: 'Pay Securely',
    //   description: 'One pay for work when it has been completed and you\'re 100% satisfied with the quality using our milestone payment system.',
    //   color: '#FFD93D'
    // },
    {
      id: 4,
      title: 'We\'re here to help',
      description: 'Our talented team of recruiter can help you find the best freelancer for the job and our technical co-pilots can even manage the project for you.',
      color: '#6A5ACD'
    }
  ];

  return (
    <div className="freelancers-specialty-container">
      <h2 className="specialty-title">SkillNest's <span>Specialty</span></h2>
      
      <div className="specialty-items">
        {specialtyItems.map((item) => (
          <div key={item.id} className="specialty-item">
            <div 
              className="specialty-dot" 
              style={{ backgroundColor: item.color }}
            />
            <div className="specialty-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="decorative-shapes">
        <div className="shape shape-1" style={{backgroundColor: '#FF6B6B'}}></div>
        <div className="shape shape-2" style={{backgroundColor: '#4ECDC4'}}></div>
        <div className="shape shape-3" style={{backgroundColor: '#FFD93D'}}></div>
        <div className="shape shape-4" style={{backgroundColor: '#6A5ACD'}}></div>
      </div>
    </div>
  );
};

export default FreelancersSpecialty;