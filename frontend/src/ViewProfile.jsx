import React, { useState, useEffect } from 'react';
import { Star, Clock, Briefcase, Award, Mail, MapPin, Calendar, ArrowRight, Heart, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import './ViewProfile.css';

const ViewProfile = ({ freelancerId }) => {
  // Dummy data for the freelancer profile
  const [freelancer, setFreelancer] = useState({
    id: freelancerId || 'fl-12345',
    name: 'Alex Johnson',
    tagline: 'Full Stack Developer & UI/UX Designer',
    profilePhoto: 'https://i.ibb.co/MDkndWx5/images.jpg',
    bio: "I'm a passionate Computer Science student with 3+ years experience in building modern web applications. I specialize in React, Node.js, and UI/UX design. I believe in creating clean, efficient code and intuitive user experiences. Currently pursuing my Bachelor's degree while taking on freelance projects that challenge me to grow.",
    email: 'alex.johnson@university.edu',
    achievements: [
      { id: 1, title: 'Top Rated Freelancer', icon: '🏆', date: 'January 2025' },
      { id: 2, title: 'Rising Talent Award', icon: '🚀', date: 'November 2024' },
      { id: 3, title: 'Hackathon Winner', icon: '🥇', date: 'August 2024' },
      { id: 4, title: '50+ Projects Completed', icon: '🎯', date: 'April 2024' }
    ],
    education: {
      university: 'Tech State University',
      degree: 'Bachelor of Science in Computer Science',
      year: '3rd Year (Expected graduation 2026)',
      gpa: '3.85/4.0',
      relevantCourses: ['Data Structures & Algorithms', 'Full Stack Development', 'UI/UX Design', 'Database Systems', 'Mobile App Development']
    },
    previousWork: [
      {
        id: 1,
        title: 'E-commerce Platform',
        description: 'Built a full-featured e-commerce platform with React, Node.js, and MongoDB. Implemented user authentication, product catalog, and payment processing.',
        image: 'https://i.pinimg.com/564x/b8/66/7e/b8667e5f5d2f912af2dab39ccccda1d9.jpg',
        client: 'FashionMart',
        feedback: 'Alex delivered exceptional work! The platform exceeded our expectations and was delivered ahead of schedule.'
      },
      {
        id: 2,
        title: 'Learning Management System',
        description: 'Developed a comprehensive LMS for a local university with user roles, course management, assignment submissions, and real-time messaging.',
        image: 'https://i.pinimg.com/564x/2f/c8/1e/2fc81e1f27cca39bf8d1e12fb2a9cb5d.jpg',
        client: 'EducationPlus',
        feedback: 'Outstanding work! Alex understood our requirements perfectly and built a system that our faculty and students love.'
      },
      {
        id: 3,
        title: 'Task Management App',
        description: 'Created a mobile-responsive task management application with drag-and-drop interfaces, task prioritization, and team collaboration features.',
        image: 'https://i.pinimg.com/564x/31/79/8a/31798af2cf73bf8539c2c73829d41f47.jpg',
        client: 'ProductivityPro',
        feedback: 'Alex is a talented developer who delivered a beautiful and functional app that has significantly improved our workflow.'
      }
    ],
    skills: [
      { name: 'React', level: 95 },
      { name: 'JavaScript', level: 90 },
      { name: 'Node.js', level: 85 },
      { name: 'UI/UX Design', level: 88 },
      { name: 'MongoDB', level: 80 },
      { name: 'Express.js', level: 82 },
      { name: 'HTML/CSS', level: 92 },
      { name: 'TypeScript', level: 78 },
      { name: 'Git/GitHub', level: 85 },
      { name: 'Responsive Design', level: 90 }
    ],
    hourlyRate: '$25',
    availability: {
      hoursPerWeek: 20,
      schedule: 'Evenings and weekends'
    },
    jobsCompleted: 57,
    ratings: {
      average: 4.8,
      breakdown: {
        5: 42,
        4: 12,
        3: 2,
        2: 1,
        1: 0
      },
      total: 57
    },
    reviews: [
      {
        id: 1,
        clientName: 'Emma Smith',
        clientAvatar: 'https://i.pinimg.com/564x/47/c4/23/47c423d58431d343cf78c8b0f940b2e0.jpg',
        rating: 5,
        date: 'March 15, 2025',
        comment: 'Alex is a phenomenal developer! He understood my project requirements perfectly and delivered ahead of schedule. His communication was excellent, and he was always open to feedback. Would definitely hire again!'
      },
      {
        id: 2,
        clientName: 'Marcus Chen',
        clientAvatar: 'https://i.pinimg.com/564x/31/3c/35/313c35f16a5a03ccd0ae41d99b02d660.jpg',
        rating: 5,
        date: 'February 28, 2025',
        comment: 'Incredible work! Alex went above and beyond what I expected. He not only built exactly what I asked for but also suggested improvements that made the final product even better. Very professional and skilled.'
      },
      {
        id: 3,
        clientName: 'Sarah Johnson',
        clientAvatar: 'https://i.pinimg.com/564x/0d/8c/82/0d8c82c3fbb6070a890d764ea397b1e1.jpg',
        rating: 4,
        date: 'January 10, 2025',
        comment: 'Great developer with solid skills. Communication was good throughout the project. The only reason for 4 stars instead of 5 is that we had a slight delay, but Alex was transparent about it and worked hard to catch up.'
      }
    ],
    location: 'Boston, MA',
    joinedDate: 'March 2023',
    languages: ['English (Native)', 'Spanish (Conversational)'],
    socialProfiles: {
      github: 'github.com/alex-johnson-dev',
      linkedin: 'linkedin.com/in/alexjohnsondev',
      portfolio: 'alexjohnson.dev'
    }
  });

  const [showToast, setShowToast] = useState(false);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');

  const handleBookNow = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const nextProject = () => {
    setCurrentProjectIndex((prev) => 
      prev === freelancer.previousWork.length - 1 ? 0 : prev + 1
    );
  };

  const prevProject = () => {
    setCurrentProjectIndex((prev) => 
      prev === 0 ? freelancer.previousWork.length - 1 : prev - 1
    );
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Rating stars rendering
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={18} 
          fill={i <= rating ? "#FFD700" : "none"} 
          stroke={i <= rating ? "#FFD700" : "#ccc"} 
        />
      );
    }
    return stars;
  };

  // Calculate the percentage for review breakdown
  const calculatePercentage = (count) => {
    return (count / freelancer.ratings.total) * 100;
  };

  return (
    <div className="view-profile-container">
      {/* Toast notification */}
      {showToast && (
        <div className="toast-notification success">
          <Check size={20} />
          <span>Booking request sent successfully! We'll notify you when Alex confirms.</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-background">
          <div className="overlay"></div>
        </div>
        
        <div className="profile-header-content">
          <div className="profile-photo-container">
            <img src={freelancer.profilePhoto} alt={freelancer.name} className="profile-photo" />
            <div className="online-indicator" title="Currently Online"></div>
          </div>
          
          <div className="profile-header-info">
            <h1>{freelancer.name} 
              <span 
                className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
                onClick={toggleFavorite}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={24} fill={isFavorite ? "#ff6b6b" : "none"} stroke={isFavorite ? "#ff6b6b" : "#333"} />
              </span>
            </h1>
            <p className="tagline"  style={{ color: 'white' }}>{freelancer.tagline}</p>
            
            <div className="profile-meta">
              <div className="meta-item"  style={{ color: 'white' }}>
                <MapPin size={16} />
                <span  style={{ color: 'white' }}>{freelancer.location}</span>
              </div>
              <div className="meta-item"  style={{ color: 'white' }}>
                <Calendar size={16} />
                <span  style={{ color: 'white' }}>Joined {freelancer.joinedDate}</span>
              </div>
              <div className="meta-item rating-meta">
                <div className="stars-container">
                  {renderStars(freelancer.ratings.average)}
                </div>
                <span className="rating-text">{freelancer.ratings.average} ({freelancer.ratings.total} reviews)</span>
              </div>
            </div>
          </div>
          
          <div className="profile-header-actions">
            <button className="book-now-button" onClick={handleBookNow}>
              Book Now
              <ArrowRight size={18} />
            </button>
            <div className="hourly-rate">
              <span className="rate-value">{freelancer.hourlyRate}</span>
              <span className="rate-unit">/hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main-content">
        <div className="profile-sidebar">
          <div className="sidebar-section quick-info">
            <h3>Quick Info</h3>
            <div className="quick-info-item">
              <Briefcase size={18} />
              <div>
                <span className="info-label">Completed Jobs</span>
                <span className="info-value">{freelancer.jobsCompleted}</span>
              </div>
            </div>
            <div className="quick-info-item">
              <Clock size={18} />
              <div>
                <span className="info-label">Availability</span>
                <span className="info-value">{freelancer.availability.hoursPerWeek} hrs/week</span>
                <span className="info-subtext">{freelancer.availability.schedule}</span>
              </div>
            </div>
            <div className="quick-info-item">
              <Mail size={18} />
              <div>
                <span className="info-label">Contact</span>
                <a href={`mailto:${freelancer.email}`} className="info-value email">{freelancer.email}</a>
              </div>
            </div>
          </div>

          <div className="sidebar-section skills">
            <h3>Skills</h3>
            <div className="skills-list">
              {freelancer.skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                  <div className="skill-progress-bg">
                    <div 
                      className="skill-progress" 
                      style={{ width: `${skill.level}%` }}
                      data-aos="width"
                      data-aos-delay={index * 100}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section education">
            <h3>Current Education</h3>
            <div className="education-content">
              <h4 className="university">{freelancer.education.university}</h4>
              <p className="degree">{freelancer.education.degree}</p>
              <p className="year">{freelancer.education.year}</p>
              <div className="education-detail">
                <span className="detail-label">GPA:</span>
                <span className="detail-value">{freelancer.education.gpa}</span>
              </div>
              <div className="relevant-courses">
                <h5>Relevant Courses:</h5>
                <div className="courses-list">
                  {freelancer.education.relevantCourses.map((course, index) => (
                    <span key={index} className="course-tag">{course}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="sidebar-section languages">
            <h3>Languages</h3>
            <div className="languages-list">
              {freelancer.languages.map((language, index) => (
                <div key={index} className="language-item">
                  <span className="language-flag">
                    {language.includes('English') ? '🇺🇸' : '🇪🇸'}
                  </span>
                  <span className="language-name">{language}</span>
                </div>
              ))}
            </div>
          </div> */}
        </div>

        <div className="profile-content">
          <div className="profile-tabs">
            <button 
              className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
            <button 
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
            <button 
              className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>

          {/* Portfolio Tab */}
          <div className={`tab-content ${activeTab === 'portfolio' ? 'active' : ''}`}>
            <h2 className="section-title">Previous Work</h2>
            <div className="portfolio-carousel">
              <button className="carousel-button prev" onClick={prevProject}>
                <ChevronLeft size={24} />
              </button>
              
              <div className="portfolio-item">
                
                <div className="portfolio-details">
                  <h3>{freelancer.previousWork[currentProjectIndex].title}</h3>
                  <p className="portfolio-client">
                    <span className="client-label">Client:</span> {freelancer.previousWork[currentProjectIndex].client}
                  </p>
                  <p className="portfolio-description">{freelancer.previousWork[currentProjectIndex].description}</p>
                  <div className="portfolio-feedback">
                    <h4>Client Feedback:</h4>
                    <blockquote>
                      "{freelancer.previousWork[currentProjectIndex].feedback}"
                    </blockquote>
                  </div>
                </div>
              </div>
              
              <button className="carousel-button next" onClick={nextProject}>
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="carousel-indicators">
              {freelancer.previousWork.map((_, index) => (
                <span 
                  key={index} 
                  className={`indicator ${index === currentProjectIndex ? 'active' : ''}`}
                  onClick={() => setCurrentProjectIndex(index)}
                ></span>
              ))}
            </div>
          </div>

          {/* About Tab */}
          <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
            <h2 className="section-title">About Me</h2>
            <div className="bio-section">
              <p className="bio-text">{freelancer.bio}</p>
              
              <div className="social-profiles">
                <h4>Connect with me:</h4>
                <div className="social-links">
                  <a href={`https://${freelancer.socialProfiles.github}`} target="_blank" rel="noopener noreferrer" className="social-link github">
                    GitHub
                  </a>
                  <a href={`https://${freelancer.socialProfiles.linkedin}`} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                    LinkedIn
                  </a>
                  <a href={`https://${freelancer.socialProfiles.portfolio}`} target="_blank" rel="noopener noreferrer" className="social-link portfolio">
                    Portfolio
                  </a>
                </div>
              </div>
              
              {/* <div className="about-sections">
                <div className="why-hire-me">
                  <h4>Why hire me? 🚀</h4>
                  <ul>
                    <li>Fast delivery without compromising quality</li>
                    <li>Strong communication and frequent updates</li>
                    <li>Attention to detail and clean code</li>
                    <li>Student perspective with professional quality</li>
                    <li>Passionate about solving problems</li>
                  </ul>
                </div>
                
                <div className="work-process">
                  <h4>My Work Process 🔄</h4>
                  <ol>
                    <li>Initial consultation and requirement gathering</li>
                    <li>Proposal and timeline creation</li>
                    <li>Design mockups and approval</li>
                    <li>Development with regular progress updates</li>
                    <li>Testing and quality assurance</li>
                    <li>Delivery and post-project support</li>
                  </ol>
                </div>
              </div> */}
            </div>
          </div>

          {/* Reviews Tab */}
          <div className={`tab-content ${activeTab === 'reviews' ? 'active' : ''}`}>
            <h2 className="section-title">Client Reviews</h2>
            
            <div className="rating-summary">
              <div className="overall-rating">
                <div className="rating-value">{freelancer.ratings.average}</div>
                <div className="stars-display">
                  {renderStars(freelancer.ratings.average)}
                </div>
                <div className="total-reviews">{freelancer.ratings.total} reviews</div>
              </div>
              
              <div className="rating-breakdown">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="breakdown-row">
                    <div className="stars-label">{rating} stars</div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{width: `${calculatePercentage(freelancer.ratings.breakdown[rating])}%`}}
                      ></div>
                    </div>
                    <div className="count-label">{freelancer.ratings.breakdown[rating]}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="reviews-list">
              {freelancer.reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <img src={review.clientAvatar} alt={review.clientName} className="client-avatar" />
                    <div className="review-meta">
                      <h4 className="client-name">{review.clientName}</h4>
                      <div className="review-details">
                        <div className="review-stars">
                          {renderStars(review.rating)}
                        </div>
                        <span className="review-date">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="review-content">
                    <p>{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Tab */}
          <div className={`tab-content ${activeTab === 'achievements' ? 'active' : ''}`}>
            <h2 className="section-title">Achievements</h2>
            
            <div className="achievements-grid">
              {freelancer.achievements.map(achievement => (
                <div key={achievement.id} className="achievement-card">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-details">
                    <h3 className="achievement-title">{achievement.title}</h3>
                    <span className="achievement-date">{achievement.date}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="stats-section">
              <h3>Performance Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">98%</div>
                  <div className="stat-label">On-time Delivery</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Response Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">95%</div>
                  <div className="stat-label">Repeat Clients</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">4.8/5</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to work with {freelancer.name.split(' ')[0]}?</h2>
          <p>Get your project started today with one of our top-rated student freelancers!</p>
        </div>
        <button className="book-now-button large" onClick={handleBookNow}>
          Book Now
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ViewProfile;