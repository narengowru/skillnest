import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, ChevronDown, FileText, Edit, Trash2, Check, 
  X, Calendar, DollarSign, Users, Clock, Award, Tag, 
  MapPin, Plus, Save, AlignLeft, Gift
} from 'lucide-react';
import { jobAPI } from '../api/api';
import './ProjectsSection.css';

const ProjectsSection = ({ client, handlePostJob }) => {
  const [expandedSections, setExpandedSections] = useState({ projects: true });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    skills: [],
    projectDuration: '',
    experienceLevel: ''
  });
  const [newSkill, setNewSkill] = useState('');

  // Categories from the job schema
  const categories = [
    "Writing & Translation",
    "Programming & Development",
    "Administrative & Secretarial",
    "Design & Art",
    "Business & Finance",
    "Sales & Marketing",
    "Others"
  ];

  // Experience levels
  const experienceLevels = [
    "Entry Level",
    "Intermediate",
    "Expert"
  ];

  // Project duration options
  const durationOptions = [
    "Less than 1 week",
    "1-2 weeks",
    "2-4 weeks",
    "1-3 months",
    "3-6 months",
    "6+ months"
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleJobDetails = (jobId) => {
    setExpandedJobId(prevId => prevId === jobId ? null : jobId);
  };

  // Fetch all jobs for the client
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        if (!client || !client.jobs || client.jobs.length === 0) {
          setJobs([]);
          setLoading(false);
          return;
        }
        
        // Fetch all jobs and filter to only those belonging to the client
        const response = await jobAPI.getAllJobs();
        const allJobs = response.data;
        console.log('Client info', client);
        // Filter jobs that belong to the client
        const clientJobs = client.jobs;
        console.log('Length', clientJobs.length);
        
        setJobs(clientJobs);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [client]);

  // Handle edit button click
  const handleEditClick = (job) => {
    setEditingJobId(job._id);
    setEditFormData({
      title: job.title,
      description: job.description,
      budget: job.budget,
      category: job.category,
      skills: [...job.skills],
      projectDuration: job.projectDuration,
      experienceLevel: job.experienceLevel
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditFormData({
      title: '',
      description: '',
      budget: '',
      category: '',
      skills: [],
      projectDuration: '',
      experienceLevel: ''
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (newSkill.trim() && !editFormData.skills.includes(newSkill.trim())) {
      setEditFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await jobAPI.updateJob(editingJobId, editFormData);
      
      // Update the jobs state with the edited job
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === editingJobId ? { ...job, ...editFormData } : job
        )
      );
      
      // Reset editing state
      setEditingJobId(null);
    } catch (err) {
      console.error("Error updating job:", err);
      alert("Failed to update project. Please try again.");
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await jobAPI.deleteJob(jobId);
        
        // Remove the deleted job from state
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
      } catch (err) {
        console.error("Error deleting job:", err);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'in-progress':
        return 'status-progress';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-open';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get applications count with status
  const getApplicationsInfo = (job) => {
    if (!job.applications || job.applications.length === 0) {
      return "No applications yet";
    }
    
    const pendingCount = job.applications.filter(app => app.status === 'pending').length;
    const acceptedCount = job.applications.filter(app => app.status === 'accepted').length;
    
    return `${job.applications.length} total (${pendingCount} pending, ${acceptedCount} accepted)`;
  };

  return (
    <motion.section 
      id="projects"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="dashboard-section projects-section"
    >
      <div className="section-header" onClick={() => toggleSection('projects')}>
        <h2>Your Projects <span className="emoji">📋</span></h2>
        <button className="toggle-button">
          {expandedSections.projects ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      {expandedSections.projects && (
        <div className="projects-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your projects...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button className="retry-button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <AnimatePresence>
              {jobs.map((job) => (
                <motion.div 
                  className="project-card"
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {editingJobId === job._id ? (
                    <form onSubmit={handleSubmit} className="edit-job-form">
                      <div className="form-header">
                        <h3>Edit Project</h3>
                        <div className="form-actions">
                          <button type="submit" className="btn-save">
                            <Save size={18} /> Save
                          </button>
                          <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
                            <X size={18} /> Cancel
                          </button>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="title">Project Title</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={editFormData.title}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="category">Category</label>
                          <select
                            id="category"
                            name="category"
                            value={editFormData.category}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="budget">Budget</label>
                          <input
                            type="text"
                            id="budget"
                            name="budget"
                            value={editFormData.budget}
                            onChange={handleChange}
                            placeholder="e.g. $500-1000"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="projectDuration">Project Duration</label>
                          <select
                            id="projectDuration"
                            name="projectDuration"
                            value={editFormData.projectDuration}
                            onChange={handleChange}
                          >
                            <option value="">Select duration</option>
                            {durationOptions.map((duration) => (
                              <option key={duration} value={duration}>
                                {duration}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="experienceLevel">Required Experience</label>
                          <select
                            id="experienceLevel"
                            name="experienceLevel"
                            value={editFormData.experienceLevel}
                            onChange={handleChange}
                          >
                            <option value="">Select level</option>
                            {experienceLevels.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="description">Project Description</label>
                        <textarea
                          id="description"
                          name="description"
                          value={editFormData.description}
                          onChange={handleChange}
                          rows="5"
                          required
                        ></textarea>
                      </div>
                      
                      <div className="form-group">
                        <label>Skills Required</label>
                        <div className="skills-input-container">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Add a skill"
                          />
                          <button 
                            type="button" 
                            className="btn-add-skill" 
                            onClick={handleAddSkill}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        
                        <div className="skills-list">
                          {editFormData.skills.map((skill, index) => (
                            <div className="skill-tag" key={index}>
                              <span>{skill}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSkill(skill)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="project-header">
                        <div className="project-title-wrapper">
                          <h3>{job.title}</h3>
                          <span className={`project-status ${getStatusColorClass(job.status)}`}>
                            {job.status === 'open' ? 'Open' : 
                             job.status === 'in-progress' ? 'In Progress' : 'Completed'}
                          </span>
                        </div>
                        <div className="project-actions">
                          <button 
                            className="action-button edit-button" 
                            onClick={() => handleEditClick(job)}
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button 
                            className="action-button delete-button" 
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="project-summary">
                        <div className="summary-item">
                          <Calendar size={16} />
                          <span>Posted: {formatDate(job.datePosted)}</span>
                        </div>
                        <div className="summary-item">
                          <DollarSign size={16} />
                          <span>Budget: {job.budget}</span>
                        </div>
                        <div className="summary-item">
                          <Tag size={16} />
                          <span>Category: {job.category}</span>
                        </div>
                        <div className="summary-item">
                          <Users size={16} />
                          <span>Applications: {getApplicationsInfo(job)}</span>
                        </div>
                      </div>
                      
                      <div className="project-toggle" onClick={() => toggleJobDetails(job._id)}>
                        <span>{expandedJobId === job._id ? 'Hide Details' : 'Show Details'}</span>
                        {expandedJobId === job._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                      
                      {expandedJobId === job._id && (
                        <motion.div 
                          className="project-details"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="detail-item">
                            <AlignLeft size={16} />
                            <div>
                              <h4>Description</h4>
                              <p>{job.description}</p>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <Clock size={16} />
                            <div>
                              <h4>Project Duration</h4>
                              <p>{job.projectDuration || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <Award size={16} />
                            <div>
                              <h4>Experience Level</h4>
                              <p>{job.experienceLevel || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="detail-item">
                            <Gift size={16} />
                            <div>
                              <h4>Skills Required</h4>
                              <div className="skills-container">
                                {job.skills && job.skills.length > 0 ? 
                                  job.skills.map((skill, index) => (
                                    <span className="skill-badge" key={index}>{skill}</span>
                                  )) : 
                                  <p>No specific skills listed</p>
                                }
                              </div>
                            </div>
                          </div>
                          
                          {job.applications && job.applications.length > 0 && (
                            <div className="applications-preview">
                              <h4>Recent Applications ({job.applications.length})</h4>
                              <div className="applications-list">
                                {job.applications.slice(0, 3).map((app, index) => (
                                  <div className="application-item" key={index}>
                                    <div className="applicant-info">
                                      <div className="applicant-avatar">
                                        {app.freelancerId?.substring(0, 2) || 'FD'}
                                      </div>
                                      <div className="applicant-details">
                                        <span className="applicant-id">Freelancer #{app.freelancerId?.substring(0, 8) || 'Unknown'}</span>
                                        <span className="application-date">Applied {formatDate(app.submittedAt)}</span>
                                      </div>
                                    </div>
                                    <span className={`application-status status-${app.status}`}>
                                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                  </div>
                                ))}
                                {job.applications.length > 3 && (
                                  <button className="view-all-button">
                                    View All Applications
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No Projects Posted Yet</h3>
              <p>You haven't posted any projects. Ready to find freelancers for your work?</p>
              <button className="primary-button" onClick={handlePostJob}>
                Post a New Project
              </button>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
};

export default ProjectsSection;