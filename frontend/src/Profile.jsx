import React, { useState, useRef, useEffect } from 'react';
import { FaLinkedin, FaGithub, FaGlobe, FaEdit, FaCamera, FaTrash, FaPlus, FaStar, FaCheckCircle, FaSignOutAlt, FaIdCard, FaMedal, FaTimes } from 'react-icons/fa';
import { MessageSquare, Eye, Check, X, Award } from 'lucide-react';
import './Profile.css';

const Profile = ({ freelancerId }) => {
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [skillEditMode, setSkillEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", level: 75 });
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationFile, setVerificationFile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [bioEditMode, setBioEditMode] = useState(false);
  const [achievementEditMode, setAchievementEditMode] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ title: "", icon: "🏆", date: "" });
  const [educationEditMode, setEducationEditMode] = useState(false);
  const [portfolioEditMode, setPortfolioEditMode] = useState(false);

  const showToast2 = (message, type) => {
    // This is where you would call your toast notification system
    window.showToast(message, type);
    // Implementation depends on which toast library you're using
  };
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingProject, setViewingProject] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const handleViewProject = (order) => {
    // In a real app, this would fetch project details from an API
    setProjectDetails({
      title: order.project,
      imageUrl: '/api/placeholder/400/250',
      budget: order.amount,
      description: 'This is a sample project description. In a real application, this would be fetched from the server based on the project ID.',
      skills: ['React', 'Node.js', 'UI/UX'],
      projectDuration: '2 weeks',
      experienceLevel: 'Intermediate',
      client: {
        name: order.client,
        avatar: '/api/placeholder/50/50',
        rating: 4.8,
        totalReviews: 24,
        memberSince: 'Jan 2023',
        location: 'New York, USA',
        verificationBadge: true,
        whatsappNumber: '+1234567890' // This would come from the real client data
      }
    });
    setViewingProject(true);
  };
  const handleAcceptOrder = (orderId) => {
    // In a real app, this would make an API call to update the order status
    showToast2('Order accepted successfully!', 'success');
    // Here you would typically update the order status in your state
  };

  const handleRejectOrder = (orderId) => {
    // In a real app, this would make an API call to update the order status
    showToast2('Order rejected', 'success');
    // Here you would typically update the order status in your state
  };

  const handleCompleteOrder = (orderId) => {
    // In a real app, this would make an API call to update the order status
    showToast2('Order marked as completed!', 'success');
    // Here you would typically update the order status in your state
  };

  const openWhatsAppChat = (phoneNumber) => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;
    window.open(whatsappUrl, '_blank');
  };

  

  const closeProjectDetails = () => {
    setViewingProject(false);
    setProjectDetails(null);
  };



  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    image: "https://i.pinimg.com/564x/31/79/8a/31798af2cf73bf8539c2c73829d41f47.jpg",
    client: "",
    feedback: ""
  });
  
  const fileInputRef = useRef(null);
  
  const [freelancer, setFreelancer] = useState({
    id: freelancerId || 'fl-12345',
    name: 'Alex Johnson',
    tagline: 'Full Stack Developer & UI/UX Designer',
    profilePhoto: 'https://i.ibb.co/MDkndWx5/images.jpg',
    bio: "I'm a passionate Computer Science student with 3+ years experience in building modern web applications. I specialize in React, Node.js, and UI/UX design. I believe in creating clean, efficient code and intuitive user experiences. Currently pursuing my Bachelor's degree while taking on freelance projects that challenge me to grow.",
    email: 'alex.johnson@university.edu',
    phone: '+1 (555) 123-4567', 
    password: '••••••••',
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
    orders: [
      { 
        id: 'ORD-2025-001', 
        client: 'DataViz Corp', 
        project: 'Data Visualization Dashboard', 
        amount: '$750', 
        status: 'Completed', 
        date: 'April 10, 2025' 
      },
      { 
        id: 'ORD-2025-002', 
        client: 'TechStart Inc', 
        project: 'Mobile App UI Design', 
        amount: '$550', 
        status: 'In Progress', 
        date: 'April 5, 2025' 
      },
      { 
        id: 'ORD-2025-003', 
        client: 'EduLearn', 
        project: 'Interactive Course Platform', 
        amount: '$1,200', 
        status: 'Pending', 
        date: 'April 2, 2025' 
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

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleImageUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFreelancer({...freelancer, profilePhoto: reader.result});
        showSuccessToast("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileChanges = () => {
    setProfileEditMode(false);
    showSuccessToast("Profile information updated successfully!");
    // Here you would typically send the updated profile to your backend
  };

  const saveBioChanges = () => {
    setBioEditMode(false);
    showSuccessToast("Bio updated successfully!");
  };

  const saveEducationChanges = () => {
    setEducationEditMode(false);
    showSuccessToast("Education details updated successfully!");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFreelancer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setFreelancer(prev => ({
      ...prev,
      education: {
        ...prev.education,
        [name]: value
      }
    }));
  };

  const handleEducationCourseChange = (index, value) => {
    const updatedCourses = [...freelancer.education.relevantCourses];
    updatedCourses[index] = value;
    
    setFreelancer(prev => ({
      ...prev,
      education: {
        ...prev.education,
        relevantCourses: updatedCourses
      }
    }));
  };

  const addEducationCourse = () => {
    setFreelancer(prev => ({
      ...prev,
      education: {
        ...prev.education,
        relevantCourses: [...prev.education.relevantCourses, ""]
      }
    }));
  };

  const removeEducationCourse = (index) => {
    const updatedCourses = [...freelancer.education.relevantCourses];
    updatedCourses.splice(index, 1);
    
    setFreelancer(prev => ({
      ...prev,
      education: {
        ...prev.education,
        relevantCourses: updatedCourses
      }
    }));
  };

  const addNewSkill = () => {
    if (newSkill.name.trim()) {
      const updatedSkills = [...freelancer.skills, { ...newSkill }];
      setFreelancer({...freelancer, skills: updatedSkills});
      setNewSkill({ name: "", level: 75 });
      showSuccessToast("New skill added successfully!");
    }
  };

  const removeSkill = (skillName) => {
    const updatedSkills = freelancer.skills.filter(skill => skill.name !== skillName);
    setFreelancer({...freelancer, skills: updatedSkills});
    showSuccessToast("Skill removed successfully!");
  };

  const addNewAchievement = () => {
    if (newAchievement.title.trim() && newAchievement.date.trim()) {
      const updatedAchievements = [
        ...freelancer.achievements, 
        { ...newAchievement, id: Date.now() }
      ];
      setFreelancer({...freelancer, achievements: updatedAchievements});
      setNewAchievement({ title: "", icon: "🏆", date: "" });
      showSuccessToast("New achievement added successfully!");
    }
  };

  const removeAchievement = (id) => {
    const updatedAchievements = freelancer.achievements.filter(achievement => achievement.id !== id);
    setFreelancer({...freelancer, achievements: updatedAchievements});
    showSuccessToast("Achievement removed successfully!");
  };

  const addNewPortfolioItem = () => {
    if (newPortfolioItem.title.trim() && newPortfolioItem.description.trim()) {
      const updatedPortfolio = [
        ...freelancer.previousWork, 
        { ...newPortfolioItem, id: Date.now() }
      ];
      setFreelancer({...freelancer, previousWork: updatedPortfolio});
      setNewPortfolioItem({
        title: "",
        description: "",
        image: "https://i.pinimg.com/564x/31/79/8a/31798af2cf73bf8539c2c73829d41f47.jpg",
        client: "",
        feedback: ""
      });
      showSuccessToast("New portfolio item added successfully!");
    }
  };

  const removePortfolioItem = (id) => {
    const updatedPortfolio = freelancer.previousWork.filter(item => item.id !== id);
    setFreelancer({...freelancer, previousWork: updatedPortfolio});
    showSuccessToast("Portfolio item removed successfully!");
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    // Simulate verification process
    setTimeout(() => {
      setIsVerified(true);
      setShowVerificationModal(false);
      showSuccessToast("Your student status has been verified successfully!");
    }, 1500);
  };

  const handleVerificationFileChange = (e) => {
    setVerificationFile(e.target.files[0]);
  };

  const renderStarRating = (rating) => {
    let stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i <= rating ? 'star filled' : 'star'} 
        />
      );
    }
    return stars;
  };

  const logout = () => {
    alert("Logging out...");
    // Here you would handle the logout logic
  };

  return (
    <div className="profile-container">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification success">
          <FaCheckCircle className="toast-icon" />
          <span>{toastMessage}</span>
          <button className="close-toast" onClick={() => setShowToast(false)}>
            <FaTimes />
          </button>
        </div>
      )}
      
      {/* Top Navigation */}
      <nav className="profile-nav">
        <div className="nav-user">
          <div className="verify-student-container">
            {isVerified ? (
              <span className="verified-badge">
                <FaCheckCircle /> Verified Student
              </span>
            ) : (
              <button className="verify-btn" onClick={() => setShowVerificationModal(true)}>
                <FaIdCard /> Verify Student Status
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Profile Header */}
      <header className="profile-header" >
        <div className="profile-header-content">
          <div className="profile-photo-container">
            <img src={freelancer.profilePhoto} alt={freelancer.name} className="profile-photo" />
            <button className="edit-photo-btn" onClick={handleImageUpload}>
              <FaCamera />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept="image/*" 
            />
          </div>
          <div className="profile-header-info">
            {profileEditMode ? (
              <input 
                type="text" 
                name="name" 
                value={freelancer.name} 
                onChange={handleInputChange} 
                className="edit-name-input"
              />
            ) : (
              <h1  style={{ color: 'white' }}>{freelancer.name} 
                <button className="edit-profile-btn" onClick={() => setProfileEditMode(true)}>
                  <FaEdit />
                </button>
              </h1>
            )}
            
            {profileEditMode ? (
              <input 
                type="text" 
                name="tagline" 
                value={freelancer.tagline} 
                onChange={handleInputChange} 
                className="edit-tagline-input"
              />
            ) : (
              <p  style={{ color: '#c0c0c0' }} className="tagline">{freelancer.tagline}</p>
            )}
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value"  style={{ color: 'white' }}>{freelancer.jobsCompleted}</span>
                <span className="stat-label"  style={{ color: 'white' }}>Jobs Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value"  style={{ color: 'white' }}>{freelancer.hourlyRate}</span>
                <span className="stat-label"  style={{ color: 'white' }}>Hourly Rate</span>
              </div>
              <div className="stat">
                <span className="stat-value"  style={{ color: 'white' }}>{freelancer.ratings.average}/5</span>
                <span className="stat-label"  style={{ color: 'white' }}>Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value"  style={{ color: 'white' }}><FaMedal className="medal-icon"/></span>
                <span className="stat-label"  style={{ color: 'white' }}>Top Rated</span>
              </div>
            </div>
            
            {profileEditMode && (
              <div className="profile-actions">
                <button className="save-btn" onClick={saveProfileChanges}>Save Changes</button>
                <button className="cancel-btn" onClick={() => setProfileEditMode(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''} 
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button 
          className={activeTab === 'reviews' ? 'active' : ''} 
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button 
          className={activeTab === 'education' ? 'active' : ''} 
          onClick={() => setActiveTab('education')}
        >
          Education
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Account Settings
        </button>
      </div>

      {/* Main Content */}
      <main className="profile-main">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <section className="bio-section">
              <div className="section-header">
                <h2>About Me</h2>
                <button 
                  className="toggle-edit-btn"
                  onClick={() => setBioEditMode(!bioEditMode)}
                >
                  {bioEditMode ? 'Done' : <FaEdit />}
                </button>
              </div>
              
              {bioEditMode ? (
                <div className="bio-edit">
                  <textarea 
                    name="bio" 
                    value={freelancer.bio} 
                    onChange={handleInputChange} 
                    className="edit-bio-input"
                  />
                  <div className="bio-actions">
                    <button className="save-bio-btn" onClick={saveBioChanges}>Save</button>
                    <button className="cancel-bio-btn" onClick={() => setBioEditMode(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <p>{freelancer.bio}</p>
              )}
            </section>

            <section className="skills-section">
              <div className="section-header">
                <h2>Skills</h2>
                <button 
                  className="toggle-edit-btn"
                  onClick={() => setSkillEditMode(!skillEditMode)}
                >
                  {skillEditMode ? 'Done' : <FaEdit />}
                </button>
              </div>
              
              <div className="skills-container">
                {freelancer.skills.map((skill, index) => (
                  <div className="skill-item" key={index}>
                    <div className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      {skillEditMode && (
                        <button 
                          className="remove-skill-btn" 
                          onClick={() => removeSkill(skill.name)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                    <div className="skill-bar-container">
                      <div 
                        className="skill-bar" 
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                ))}
              </div>
              
              {skillEditMode && (
                <div className="add-skill-form">
                  <input 
                    type="text" 
                    placeholder="New skill name" 
                    value={newSkill.name} 
                    onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} 
                  />
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={newSkill.level} 
                    onChange={(e) => setNewSkill({...newSkill, level: parseInt(e.target.value)})} 
                  />
                  <span>{newSkill.level}%</span>
                  <button onClick={addNewSkill} className="add-skill-btn">
                    <FaPlus /> Add Skill
                  </button>
                </div>
              )}
            </section>

            <section className="achievements-section">
              <div className="section-header">
                <h2>Achievements</h2>
                <button 
                  className="toggle-edit-btn"
                  onClick={() => setAchievementEditMode(!achievementEditMode)}
                >
                  {achievementEditMode ? 'Done' : <FaEdit />}
                </button>
              </div>
              
              <div className="achievements-container">
                {freelancer.achievements.map((achievement) => (
                  <div className="achievement-card" key={achievement.id}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-details">
                      <h3>{achievement.title}</h3>
                      <p>{achievement.date}</p>
                    </div>
                    {achievementEditMode && (
                      <button 
                        className="remove-achievement-btn" 
                        onClick={() => removeAchievement(achievement.id)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {achievementEditMode && (
                <div className="add-achievement-form">
                  <div className="form-group">
                    <label>Achievement Title</label>
                    <input 
                      type="text" 
                      placeholder="E.g. Top Rated Freelancer" 
                      value={newAchievement.title} 
                      onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon (emoji)</label>
                    <select 
                      value={newAchievement.icon} 
                      onChange={(e) => setNewAchievement({...newAchievement, icon: e.target.value})}
                    >
                      <option value="🏆">🏆 Trophy</option>
                      <option value="🚀">🚀 Rocket</option>
                      <option value="🥇">🥇 Gold Medal</option>
                      <option value="🎯">🎯 Target</option>
                      <option value="⭐">⭐ Star</option>
                      <option value="🔥">🔥 Fire</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="text" 
                      placeholder="E.g. January 2025" 
                      value={newAchievement.date} 
                      onChange={(e) => setNewAchievement({...newAchievement, date: e.target.value})} 
                    />
                  </div>
                  <button onClick={addNewAchievement} className="add-achievement-btn">
                    <FaPlus /> Add Achievement
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-content">
            <div className="section-header">
              <h2>Previous Work</h2>
              <button 
                className="toggle-edit-btn"
                onClick={() => setPortfolioEditMode(!portfolioEditMode)}
              >
                {portfolioEditMode ? 'Done' : <FaEdit />}
              </button>
            </div>
            
            <div className="portfolio-grid">
              {freelancer.previousWork.map((work) => (
                <div className="portfolio-item" key={work.id}>
                  {/* <div className="portfolio-image">
                    <img src={work.image} alt={work.title} />
                    {portfolioEditMode && (
                      <button 
                        className="remove-portfolio-btn" 
                        onClick={() => removePortfolioItem(work.id)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div> */}
                  <div className="portfolio-details">
                    <h3>{work.title}</h3>
                    <p className="portfolio-client">Client: {work.client}</p>
                    <p>{work.description}</p>
                    <div className="portfolio-feedback">
                      <h4>Client Feedback:</h4>
                      <p>"{work.feedback}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {portfolioEditMode && (
              <div className="add-portfolio-form">
                <h3>Add New Portfolio Item</h3>
                <div className="form-group">
                  <label>Project Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g. E-commerce Platform" 
                    value={newPortfolioItem.title} 
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Client Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g. FashionMart" 
                    value={newPortfolioItem.client} 
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, client: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    placeholder="Describe the project" 
                    value={newPortfolioItem.description} 
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  {/* <label>Image URL</label> */}
                  {/* <input 
                    type="text" 
                    placeholder="Image URL" 
                    value={newPortfolioItem.image} 
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, image: e.target.value})} 
                  /> */}
                </div>
                <div className="form-group">
                  <label>Client Feedback</label>
                  <textarea 
                    placeholder="What did the client say about your work?" 
                    value={newPortfolioItem.feedback} 
                    onChange={(e) => setNewPortfolioItem({...newPortfolioItem, feedback: e.target.value})} 
                  />
                </div>
                <button onClick={addNewPortfolioItem} className="add-portfolio-btn">
                  <FaPlus /> Add Portfolio Item
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-content">
            <div className="reviews-summary">
              <div className="average-rating">
                <h2>{freelancer.ratings.average}</h2>
                <div className="star-container">
                  {renderStarRating(freelancer.ratings.average)}
                </div>
                <p>Based on {freelancer.ratings.total} reviews</p>
              </div>
              <div className="rating-breakdown">
                {Object.entries(freelancer.ratings.breakdown).reverse().map(([rating, count]) => (
                  <div className="rating-row" key={rating}>
                    <span>{rating} stars</span>
                    <div className="rating-bar-container">
                      <div 
                        className="rating-bar" 
                        style={{ width: `${(count/freelancer.ratings.total)*100}%` }}
                      ></div>
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="reviews-list">
              <h2>Client Reviews</h2>
              {freelancer.reviews.map((review) => (
                <div className="review-card" key={review.id}>
                  <div className="review-header">
                    <img src={review.clientAvatar} alt={review.clientName} className="client-avatar" />
                    <div className="review-info">
                      <h3>{review.clientName}</h3>
                      <div className="review-stars">
                        {renderStarRating(review.rating)}
                      </div>
                      <p className="review-date">{review.date}</p>
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="education-content">
            <div className="section-header">
              <h2>Education</h2>
              <button 
                className="toggle-edit-btn"
                onClick={() => setEducationEditMode(!educationEditMode)}
              >
                {educationEditMode ? 'Done' : <FaEdit />}
              </button>
            </div>
            
            <div className="education-card">
              {educationEditMode ? (
                <div className="education-edit-form">
                  <div className="form-group">
                    <label>University/College</label>
                    <input 
                      type="text" 
                      name="university" 
                      value={freelancer.education.university} 
                      onChange={handleEducationChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Degree</label>
                    <input 
                      type="text" 
                      name="degree" 
                      value={freelancer.education.degree} 
                      onChange={handleEducationChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input 
                      type="text" 
                      name="year" 
                      value={freelancer.education.year} 
                      onChange={handleEducationChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>GPA</label>
                    <input 
                      type="text" 
                      name="gpa" 
                      value={freelancer.education.gpa} 
                      onChange={handleEducationChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Relevant Courses</label>
                    {freelancer.education.relevantCourses.map((course, index) => (
                      <div className="course-input" key={index}>
                        <input 
                          type="text" 
                          value={course} 
                          onChange={(e) => handleEducationCourseChange(index, e.target.value)} 
                        />
                        <button 
                          className="remove-course-btn" 
                          onClick={() => removeEducationCourse(index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button className="add-course-btn" onClick={addEducationCourse}>
                      <FaPlus /> Add Course
                    </button>
                  </div>
                  <div className="education-action-btns">
                    <button className="save-education-btn" onClick={saveEducationChanges}>Save Changes</button>
                    <button className="cancel-education-btn" onClick={() => setEducationEditMode(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="education-header">
                    <h3>{freelancer.education.university}</h3>
                    <p>{freelancer.education.degree}</p>
                  </div>
                  <div className="education-details">
                    <p><strong>Year:</strong> {freelancer.education.year}</p>
                    <p><strong>GPA:</strong> {freelancer.education.gpa}</p>
                  </div>
                  <div className="education-courses">
                    <h4>Relevant Courses:</h4>
                    <ul>
                      {freelancer.education.relevantCourses.map((course, index) => (
                        <li key={index}>{course}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-content">
          <h2>My Orders</h2>
          
          {viewingProject && projectDetails ? (
            <div className="project-details-modal">
              <div className="project-details-header">
                <h3>{projectDetails.title}</h3>
                <button className="close-button" onClick={closeProjectDetails}>×</button>
              </div>
              
              <div className="project-details-body">
                <div className="project-image">
                  <img src={projectDetails.imageUrl} alt={projectDetails.title} />
                </div>
                
                <div className="project-info">
                  <div className="info-row">
                    <span className="info-label">Budget:</span>
                    <span className="info-value">{projectDetails.budget}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{projectDetails.projectDuration}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Experience Level:</span>
                    <span className="info-value">{projectDetails.experienceLevel}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Skills Required:</span>
                    <div className="skills-list">
                      {projectDetails.skills.map((skill, index) => (
                        <span key={index} className="skill-tag"  style={{ color: 'white' }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="info-description">
                    <span className="info-label">Description:</span>
                    <p>{projectDetails.description}</p>
                  </div>
                </div>
                
                <div className="client-info">
                  <h4>Client Information</h4>
                  <div className="client-header">
                    <img src={projectDetails.client.avatar} alt={projectDetails.client.name} className="client-avatar" />
                    <div>
                      <span className="client-name">
                        {projectDetails.client.name}
                        {projectDetails.client.verificationBadge && <span className="verification-badge"><Award size={14} /></span>}
                      </span>
                      <div className="client-rating">
                        <span className="stars">{'★'.repeat(Math.floor(projectDetails.client.rating))}{'☆'.repeat(5 - Math.floor(projectDetails.client.rating))}</span>
                        <span className="rating-number">{projectDetails.client.rating}</span>
                        <span className="total-reviews">({projectDetails.client.totalReviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="client-details">
                    <div className="info-row">
                      <span className="info-label">Member Since:</span>
                      <span className="info-value">{projectDetails.client.memberSince}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{projectDetails.client.location}</span>
                    </div>
                    
                    <button 
                      className="whatsapp-chat-btn"
                      onClick={() => openWhatsAppChat(projectDetails.client.whatsappNumber)}
                    >
                      <MessageSquare size={16} />
                      Chat on WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="orders-list">
              <div className="orders-header">
                <span>Order ID</span>
                <span>Client</span>
                <span>Project</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              
              {freelancer.orders.map((order) => (
                <div className="order-item" key={order.id}>
                  <span>{order.id}</span>
                  <span>{order.client}</span>
                  <span>{order.project}</span>
                  <span>{order.amount}</span>
                  <span>{order.date}</span>
                  <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                  <div className="order-actions">
                    <button 
                      className="action-btn view-btn" 
                      onClick={() => handleViewProject(order)}
                      title="View Project Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {order.status === 'Pending' && (
                      <>
                        <button 
                          className="action-btn accept-btn" 
                          onClick={() => handleAcceptOrder(order.id)}
                          title="Accept Order"
                        >
                          <Check size={16} />
                        </button>
                        
                        <button 
                          className="action-btn reject-btn" 
                          onClick={() => handleRejectOrder(order.id)}
                          title="Reject Order"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    
                    {order.status === 'In Progress' && (
                      <button 
                        className="action-btn complete-btn" 
                        onClick={() => handleCompleteOrder(order.id)}
                        title="Mark as Complete"
                      >
                        <Award size={16} />
                      </button>
                    )}
                    
                    {(order.status === 'In Progress' || order.status === 'Completed') && (
                      <button 
                        className="action-btn chat-btn" 
                        onClick={() => openWhatsAppChat('+1234567890')} 
                        title="Chat with Client"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-content">
            <h2>Account Settings</h2>
            
            <div className="settings-section">
              <h3>Personal Information</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={freelancer.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={freelancer.email} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={freelancer.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={freelancer.location} onChange={handleInputChange} />
                </div>
              </div>
            </div>
            
            <div className="settings-section">
              <h3>Security</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" value={freelancer.password} disabled />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" />
                </div>
                <button className="update-password-btn">Update Password</button>
              </div>
            </div>
            
            <div className="settings-section">
              <h3>Social Profiles</h3>
              <div className="settings-form">
                <div className="form-group social-input">
                  <FaLinkedin className="social-icon" />
                  <input type="text" value={freelancer.socialProfiles.linkedin} onChange={(e) => setFreelancer({...freelancer, socialProfiles: {...freelancer.socialProfiles, linkedin: e.target.value}})} />
                </div>
                <div className="form-group social-input">
                  <FaGithub className="social-icon" />
                  <input type="text" value={freelancer.socialProfiles.github} onChange={(e) => setFreelancer({...freelancer, socialProfiles: {...freelancer.socialProfiles, github: e.target.value}})} />
                </div>
                <div className="form-group social-input">
                  <FaGlobe className="social-icon" />
                  <input type="text" value={freelancer.socialProfiles.portfolio} onChange={(e) => setFreelancer({...freelancer, socialProfiles: {...freelancer.socialProfiles, portfolio: e.target.value}})} />
                </div>
              </div>
            </div>
            
            <div className="settings-buttons">
              <button className="save-changes-btn" onClick={() => showSuccessToast("Settings updated successfully!")}>Save All Changes</button>
              <button className="delete-account-btn">Delete Account</button>
            </div>
          </div>
        )}
      </main>

      {/* Student Verification Modal */}
      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="verification-modal">
            <h2>Verify Student Status</h2>
            <p>Please upload a clear image of your college/school ID to verify your student status.</p>
            
            <form onSubmit={handleVerificationSubmit}>
              <div className="file-upload-container">
                <label htmlFor="verification-file" className="file-upload-label">
                  <FaIdCard /> Choose ID Image
                </label>
                <input 
                  type="file" 
                  id="verification-file" 
                  onChange={handleVerificationFileChange} 
                  accept="image/*" 
                  required 
                />
                {verificationFile && (
                  <p className="file-name">{verificationFile.name}</p>
                )}
              </div>
              
              <div className="verification-form-group">
                <label>University/College Name</label>
                <input type="text" placeholder="Enter your institution name" required />
              </div>
              
              <div className="verification-form-group">
                <label>Student ID Number</label>
                <input type="text" placeholder="Enter your student ID" required />
              </div>
              
              <div className="verification-form-group">
                <label>Graduation Year</label>
                <input type="text" placeholder="Expected graduation year" required />
              </div>
              
              <div className="modal-buttons">
                <button type="submit" className="submit-verification-btn">Submit for Verification</button>
                <button 
                  type="button" 
                  className="cancel-verification-btn" 
                  onClick={() => setShowVerificationModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;