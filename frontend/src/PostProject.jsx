import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Plus, X, Upload, Check } from 'lucide-react';
import './PostProject.css';
import { jobAPI } from './api/api';


const PostProject = () => {
  const [step, setStep] = useState(1);
  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [project, setProject] = useState({
    title: '',
    category: '',
    imageUrl: '',
    budget: '',
    description: '',
    skills: [],
    projectDuration: '',
    experienceLevel: 'Intermediate',
    client: {
      name: '',
      avatar: '',
      rating: 0,
      totalReviews: 0,
      memberSince: '',
      location: '',
      verificationBadge: false
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProject({
        ...project,
        [parent]: {
          ...project[parent],
          [child]: value
        }
      });
    } else {
      setProject({
        ...project,
        [name]: value
      });
    }
  };

  const handleSkillAdd = () => {
    if (newSkill && !project.skills.includes(newSkill)) {
      setProject({
        ...project,
        skills: [...project.skills, newSkill]
      });
      setNewSkill('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setProject({
      ...project,
      skills: project.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSkillAdd();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use the jobAPI to create the job
      const response =  jobAPI.createJob(project);
      console.log("Project submitted:", response);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting project:", error);
      setIsSubmitting(false);
      // You might want to add error handling state and UI
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  // Image upload simulation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProject({
          ...project,
          imageUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProject({
          ...project,
          client: {
            ...project.client,
            avatar: e.target.result
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="post-project-container">
      <h1 className="project-header">Post a New Project</h1>
      
      <div className="stepper">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <span>Basic Info</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span>Project Details</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Client Info</span>
        </div>
      </div>
      
      <div className="form-content">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          <div className={`step-panel ${step === 1 ? 'active' : ''}`}>
            <div className="panel-content">
              <div className="input-section">
                <h2>Basic Project Information</h2>
                <p>Let's start with the essential details of your project.</p>
                
                <div className="form-group">
                  <label htmlFor="title">Project Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={project.title}
                    onChange={handleChange}
                    placeholder="E.g., E-commerce Website Redesign"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Project Category</label>
                  <select
                    id="category"
                    name="category"
                    value={project.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Writing & Translation">Writing & Translation</option>
                    <option value="Programming & Development">Programming & Development</option>
                    <option value="Administrative & Secretarial">Administrative & Secretarial</option>
                    <option value="Design & Art">Design & Art</option>
                    <option value="Business & Finance">Business & Finance</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="budget">Budget Range</label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={project.budget}
                    onChange={handleChange}
                    placeholder="E.g., $2,500 - $3,500"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="projectDuration">Project Duration</label>
                  <select
                    id="projectDuration"
                    name="projectDuration"
                    value={project.projectDuration}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="Less than 1 month">Less than a week</option>
                    <option value="1-2 months">1-2 weeks</option>
                    <option value="2-3 months">2-4 weeks</option>
                    <option value="3-6 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="More than 6 months">More than 6 months</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="experienceLevel">Required Experience Level</label>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    value={project.experienceLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                    <option value="Intermediate to Expert">Intermediate to Expert</option>
                  </select>
                </div>
              </div>
              
              <div className="preview-section">
                <div className="image-upload-container">
                  <label htmlFor="projectImage" className="image-upload-label">
                    <div className="upload-area">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt="Project preview" className="uploaded-image" />
                      ) : (
                        <>
                          <Upload size={48} />
                          <p>Upload Project Image</p>
                          <span>Drag & drop or click to browse</span>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    type="file"
                    id="projectImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </div>
                
                {project.title && (
                  <div className="project-preview">
                    <h3>Project Preview</h3>
                    <div className="preview-card">
                      <h4>{project.title}</h4>
                      {project.category && <p>Category: {project.category}</p>}
                      {project.budget && <p>Budget: {project.budget}</p>}
                      {project.projectDuration && <p>Duration: {project.projectDuration}</p>}
                      <p>Experience: {project.experienceLevel}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="navigation-buttons">
              <button type="button" onClick={handleNext} className="btn-next">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Step 2: Project Details */}
          <div className={`step-panel ${step === 2 ? 'active' : ''}`}>
            <div className="panel-content">
              <div className="input-section">
                <h2>Project Details</h2>
                <p>Add specific details about your project requirements.</p>
                
                <div className="form-group">
                  <label htmlFor="description">Project Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={project.description}
                    onChange={handleChange}
                    placeholder="Provide a detailed description of your project requirements..."
                    rows="6"
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label>Required Skills</label>
                  <div className="skills-input-container">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add skills (Press Enter or click +)"
                    />
                    <button 
                      type="button" 
                      className="add-skill-btn"
                      onClick={handleSkillAdd}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <div className="skills-container">
                    {project.skills.map((skill, index) => (
                      <div key={index} className="skill-tag" style={{ color: 'white' }}>
                        {skill}
                        <button 
                          type="button"
                          className="remove-skill"
                          style={{ color: 'white' }}
                          onClick={() => handleSkillRemove(skill)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="preview-section">
                <div className="details-visualization">
                  {project.description ? (
                    <div className="description-preview">
                      <h3>Project Description</h3>
                      <p>{project.description}</p>
                    </div>
                  ) : (
                    <div className="placeholder-content">
                      <p>Your project description will appear here</p>
                    </div>
                  )}
                  
                  {project.skills.length > 0 && (
                    <div className="skills-preview">
                      <h3>Required Skills</h3>
                      <div className="skills-cloud">
                        {project.skills.map((skill, index) => (
                          <span key={index} className="skill-bubble">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="navigation-buttons">
              <button type="button" onClick={handlePrev} className="btn-prev">
                <ChevronLeft size={18} /> Previous
              </button>
              <button type="button" onClick={handleNext} className="btn-next">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Step 3: Client Info */}
          <div className={`step-panel ${step === 3 ? 'active' : ''}`}>
            <div className="panel-content">
              <div className="input-section">
                <h2>Client Information</h2>
                <p>Please provide details about your company or organization.</p>
                
                <div className="form-group">
                  <label htmlFor="client.name">Company or Client Name</label>
                  <input
                    type="text"
                    id="client.name"
                    name="client.name"
                    value={project.client.name}
                    onChange={handleChange}
                    placeholder="Your company or name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="client.location">Location</label>
                  <input
                    type="text"
                    id="client.location"
                    name="client.location"
                    value={project.client.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="client.memberSince">Member Since</label>
                  <input
                    type="text"
                    id="client.memberSince"
                    name="client.memberSince"
                    value={project.client.memberSince}
                    onChange={handleChange}
                    placeholder="E.g., April 2025"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="verificationBadge"
                    name="client.verificationBadge"
                    checked={project.client.verificationBadge}
                    onChange={(e) => {
                      setProject({
                        ...project,
                        client: {
                          ...project.client,
                          verificationBadge: e.target.checked
                        }
                      });
                    }}
                  />
                  <label htmlFor="verificationBadge">Request Verification Badge</label>
                </div>
              </div>
              
              <div className="preview-section">
                <div className="client-avatar-upload">
                  <label htmlFor="clientAvatar" className="avatar-upload-label">
                    <div className="avatar-upload-area">
                      {project.client.avatar ? (
                        <img src={project.client.avatar} alt="Client Avatar" className="uploaded-avatar" />
                      ) : (
                        <>
                          <Upload size={32} />
                          <p>Upload Logo/Avatar</p>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    type="file"
                    id="clientAvatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="file-input"
                  />
                </div>
                
                {project.client.name && (
                  <div className="client-preview">
                    <h3>Client Preview</h3>
                    <div className="client-card">
                      <div className="client-header">
                        {project.client.avatar && (
                          <img src={project.client.avatar} alt="Client" className="client-avatar" />
                        )}
                        <div className="client-info">
                          <h4>{project.client.name}</h4>
                          {project.client.location && <p>{project.client.location}</p>}
                          {project.client.verificationBadge && (
                            <span className="verification-badge">
                              <Check size={12} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                      {project.client.memberSince && (
                        <p className="member-since">Member since {project.client.memberSince}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="navigation-buttons">
              <button type="button" onClick={handlePrev} className="btn-prev">
                <ChevronLeft size={18} /> Previous
              </button>
              <button 
                type="submit" 
                className={`btn-submit ${isSubmitting ? 'submitting' : ''} ${submitSuccess ? 'success' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="submitting-text">Posting...</span>
                ) : submitSuccess ? (
                  <>
                    <Check size={18} />
                    <span>Posted Successfully!</span>
                  </>
                ) : (
                  <span>Post Project</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostProject;