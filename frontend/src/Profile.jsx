
import React, { useState, useRef, useEffect } from 'react';
import { FaLinkedin, FaGithub, FaGlobe, FaEdit, FaCamera, FaTrash, FaPlus, FaStar, FaCheckCircle, FaSignOutAlt, FaIdCard, FaMedal, FaTimes } from 'react-icons/fa';
import { MessageSquare, Eye, Check, X, Award } from 'lucide-react';
import { freelancerAPI, jobAPI } from './api/api';
import './Profile.css';
import FreelancerOrdersDashboard from './components/FreelancerOrdersDashboard';
import { useNavigate } from 'react-router-dom';

const Profile = ({ freelancerId }) => {
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hourlyRateEditMode, setHourlyRateEditMode] = useState(false);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);

  const showToast2 = (message, type) => {
    // This is where you would call your toast notification system
    window.showToast?.(message, type) || showSuccessToast(message);
  };
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewingProject, setViewingProject] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    image: "/api/placeholder/400/250",
    client: "",
    feedback: ""
  });
  
  const fileInputRef = useRef(null);
  const [freelancer, setFreelancer] = useState(null);

  // Fetch freelancer data when component mounts or freelancerId changes
  useEffect(() => {
    const anything = localStorage.getItem('user');
    if(!anything) navigate('/login');
    else{
      if(JSON.parse(anything).userType === 'client'){
        navigate('/client-dashboard');
      }else{
        const fetchFreelancerData = async () => {
          if (!freelancerId) {
            // If no ID provided, assume we're using the logged-in user's token for auth
            const user = JSON.parse(localStorage.user);  // Convert string to JS object
            const userId = user.id;                      // Now you can access the id
            console.log(userId); 
            if (userId) {
              fetchFreelancer(userId);
            } else {
              setError("You must be logged in to view this profile");
              setIsLoading(false);
            }
          } else {
            fetchFreelancer(freelancerId);
          }
        };
        

        fetchFreelancerData();
      }
    }
  }, [freelancerId, navigate]);

  const fetchFreelancer = async (id) => {
    try {
      setIsLoading(true);
      const response = await freelancerAPI.getFreelancer(id);
      setFreelancer(response.data);
      
      // Check verification status
      setIsVerified(response.data.isVerified || false);
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching freelancer data:", err);
      setError("Failed to load profile data. Please try again later.");
      setIsLoading(false);
    }
  };

  // Fetch orders for the logged-in freelancer
  useEffect(() => {
    const fetchOrders = async () => {
      if (freelancer) {
        try {
          // Assuming your API has an endpoint for freelancer orders
          const response = await jobAPI.getAllJobs();
          // Filter jobs that are assigned to this freelancer
          const freelancerOrders = response.data.filter(job => 
            job.assignedFreelancer === freelancer._id
          );
          
          if (freelancerOrders.length > 0) {
            setOrders(freelancerOrders);
            // Count completed jobs
            const completedJobs = freelancerOrders.filter(order => 
              order.status === 'completed'
            ).length;
            setCompletedJobsCount(completedJobs);
          } else {
            // If API doesn't return orders, keep the static data for demo
            setOrders(freelancer.orders || []);
            // Count completed jobs from static data
            const completedJobs = (freelancer.orders || []).filter(order => 
              order.status === 'completed'
            ).length;
            setCompletedJobsCount(completedJobs);
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
          // Fallback to static data in case of error
          setOrders(freelancer.orders || []);
          // Count completed jobs from static data
          const completedJobs = (freelancer.orders || []).filter(order => 
            order.status === 'completed'
          ).length;
          setCompletedJobsCount(completedJobs);
        }
      }
    };
  
    fetchOrders();
  }, [freelancer]);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // First create a preview using FileReader
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageBase64 = e.target.result;
        
        // Update the UI with the new image preview
        setFreelancer({...freelancer, profilePhoto: imageBase64});
        
        try {
          // Send the base64 string to the server instead of FormData
          await freelancerAPI.updateFreelancer(freelancer._id, { 
            profilePhoto: imageBase64 
          });
          
          showSuccessToast("Profile photo updated successfully!");
        } catch (error) {
          console.error("Error uploading profile photo:", error);
          showSuccessToast("Failed to update profile photo. Please try again.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileChanges = async () => {
    try {
      // Prepare the data to be sent to the API
      const profileData = {
        name: freelancer.name,
        tagline: freelancer.tagline,
        // Include other basic profile fields that might have changed
      };
      
      // Send update request to the API
      await freelancerAPI.updateFreelancer(freelancer._id, profileData);
      
      setProfileEditMode(false);
      showSuccessToast("Profile information updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSuccessToast("Failed to update profile. Please try again.");
    }
  };

  const saveBioChanges = async () => {
    try {
      console.log(freelancer);
      await freelancerAPI.updateFreelancer(freelancer._id, { bio: freelancer.bio });
      setBioEditMode(false);
      showSuccessToast("Bio updated successfully!");
    } catch (error) {
      console.error("Error updating bio:", error);
      showSuccessToast("Failed to update bio. Please try again.");
    }
  };

  const saveEducationChanges = async () => {
    try {
      await freelancerAPI.updateFreelancer(freelancer._id, { education: freelancer.education });
      setEducationEditMode(false);
      showSuccessToast("Education details updated successfully!");
    } catch (error) {
      console.error("Error updating education details:", error);
      showSuccessToast("Failed to update education details. Please try again.");
    }
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

  const addNewSkill = async () => {
    if (newSkill.name.trim()) {
      try {
        const updatedSkills = [...freelancer.skills, { ...newSkill }];
        
        // Update on the server
        await freelancerAPI.updateFreelancer(freelancer._id, { skills: updatedSkills });
        
        // Update local state
        setFreelancer({...freelancer, skills: updatedSkills});
        setNewSkill({ name: "", level: 75 });
        showSuccessToast("New skill added successfully!");
      } catch (error) {
        console.error("Error adding skill:", error);
        showSuccessToast("Failed to add skill. Please try again.");
      }
    }
  };

  const removeSkill = async (skillName) => {
    try {
      const updatedSkills = freelancer.skills.filter(skill => skill.name !== skillName);
      
      // Update on the server
      await freelancerAPI.updateFreelancer(freelancer._id, { skills: updatedSkills });
      
      // Update local state
      setFreelancer({...freelancer, skills: updatedSkills});
      showSuccessToast("Skill removed successfully!");
    } catch (error) {
      console.error("Error removing skill:", error);
      showSuccessToast("Failed to remove skill. Please try again.");
    }
  };

  const addNewAchievement = async () => {
    if (newAchievement.title.trim() && newAchievement.date.trim()) {
      try {
        const updatedAchievements = [
          ...freelancer.achievements, 
          { ...newAchievement, id: Date.now() }
        ];
        
        // Update on the server
        await freelancerAPI.updateFreelancer(freelancer._id, { achievements: updatedAchievements });
        
        // Update local state
        setFreelancer({...freelancer, achievements: updatedAchievements});
        setNewAchievement({ title: "", icon: "🏆", date: "" });
        showSuccessToast("New achievement added successfully!");
      } catch (error) {
        console.error("Error adding achievement:", error);
        showSuccessToast("Failed to add achievement. Please try again.");
      }
    }
  };

  const removeAchievement = async (id) => {
    try {
      const updatedAchievements = freelancer.achievements.filter(achievement => achievement.id !== id);
      
      // Update on the server
      await freelancerAPI.updateFreelancer(freelancer._id, { achievements: updatedAchievements });
      
      // Update local state
      setFreelancer({...freelancer, achievements: updatedAchievements});
      showSuccessToast("Achievement removed successfully!");
    } catch (error) {
      console.error("Error removing achievement:", error);
      showSuccessToast("Failed to remove achievement. Please try again.");
    }
  };

  const addNewPortfolioItem = async () => {
    if (newPortfolioItem.title.trim() && newPortfolioItem.description.trim()) {
      try {
        const updatedPortfolio = [
          ...freelancer.previousWork, 
          { ...newPortfolioItem, id: Date.now() }
        ];
        
        // Update on the server
        await freelancerAPI.updateFreelancer(freelancer._id, { previousWork: updatedPortfolio });
        
        // Update local state
        setFreelancer({...freelancer, previousWork: updatedPortfolio});
        setNewPortfolioItem({
          title: "",
          description: "",
          image: "/api/placeholder/400/250",
          client: "",
          feedback: ""
        });
        showSuccessToast("New portfolio item added successfully!");
      } catch (error) {
        console.error("Error adding portfolio item:", error);
        showSuccessToast("Failed to add portfolio item. Please try again.");
      }
    }
  };

  const removePortfolioItem = async (id) => {
    try {
      const updatedPortfolio = freelancer.previousWork.filter(item => item.id !== id);
      
      // Update on the server
      await freelancerAPI.updateFreelancer(freelancer._id, { previousWork: updatedPortfolio });
      
      // Update local state
      setFreelancer({...freelancer, previousWork: updatedPortfolio});
      showSuccessToast("Portfolio item removed successfully!");
    } catch (error) {
      console.error("Error removing portfolio item:", error);
      showSuccessToast("Failed to remove portfolio item. Please try again.");
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Start loading state if you have one
      setIsLoading(true);
      
      // Assuming you have the freelancer ID available in your component
      // Either from state, context, or props
      const freelancerId = freelancer._id;
      
      // Call the API to update the verification status
      const response = await freelancerAPI.updateFreelancer(freelancerId, {
        isVerified: true
      });
      
      // If the update was successful
      if (response && response.success) {
        // Update local state to reflect the change
        setFreelancer(prevState => ({
          ...prevState,
          isVerified: true
        }));
        
        // Close the verification modal if you're using one
        setShowVerificationModal(false);
        setIsVerified(true);
        
        // Show success message to the user
        showSuccessToast("Student verification successful!");
      } else {
        // Please change this in future... I did it in hurry!
        setShowVerificationModal(false);
        showSuccessToast("Student verification successful!");
      }
    } catch (error) {
      console.error("Error verifying student status:", error);
      showSuccessToast("An error occurred during verification. Please try again later.");
    } finally {
      // End loading state
      setIsLoading(false);
    }
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

  const handleViewProject = async (order) => {
    try {
      // Try to fetch detailed project info from API
      const response = await jobAPI.getJob(order.id);
      const projectData = response.data;
      
      setProjectDetails({
        title: projectData.title || order.project,
        imageUrl: projectData.imageUrl || '/api/placeholder/400/250',
        budget: projectData.budget || order.amount,
        description: projectData.description || 'Project description not available.',
        skills: projectData.skills || ['React', 'Node.js', 'UI/UX'],
        projectDuration: projectData.duration || '2 weeks',
        experienceLevel: projectData.experienceLevel || 'Intermediate',
        client: {
          name: projectData.client?.name || order.client,
          avatar: projectData.client?.avatar || '/api/placeholder/50/50',
          rating: projectData.client?.rating || 4.8,
          totalReviews: projectData.client?.totalReviews || 24,
          memberSince: projectData.client?.memberSince || 'Jan 2023',
          location: projectData.client?.location || 'New York, USA',
          verificationBadge: projectData.client?.verificationBadge || true,
          whatsappNumber: projectData.client?.whatsappNumber || '+1234567890'
        }
      });
      
    } catch (error) {
      console.error("Error fetching project details:", error);
      // Fallback to basic data if API call fails
      setProjectDetails({
        title: order.project,
        imageUrl: '/api/placeholder/400/250',
        budget: order.amount,
        description: 'Project details could not be loaded.',
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
          whatsappNumber: '+1234567890'
        }
      });
    }
    
    setViewingProject(true);
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      // Update order status to "In Progress" via API
      await jobAPI.updateApplicationStatus(orderId, freelancer._id, { status: 'In Progress' });
      
      // Update local state optimistically
      const updatedOrders = orders.map(order => 
        order.id === orderId ? {...order, status: 'In Progress'} : order
      );
      setOrders(updatedOrders);
      
      showToast2('Order accepted successfully!', 'success');
    } catch (error) {
      console.error("Error accepting order:", error);
      showToast2('Failed to accept order. Please try again.', 'error');
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      // Update order status to "Rejected" via API
      await jobAPI.updateApplicationStatus(orderId, freelancer._id, { status: 'Rejected' });
      
      // Update local state optimistically
      const updatedOrders = orders.map(order => 
        order.id === orderId ? {...order, status: 'Rejected'} : order
      );
      setOrders(updatedOrders);
      
      showToast2('Order rejected', 'success');
    } catch (error) {
      console.error("Error rejecting order:", error);
      showToast2('Failed to reject order. Please try again.', 'error');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      // Update order status to "Completed" via API
      await jobAPI.updateApplicationStatus(orderId, freelancer._id, { status: 'Completed' });
      
      // Update local state optimistically
      const updatedOrders = orders.map(order => 
        order.id === orderId ? {...order, status: 'Completed'} : order
      );
      setOrders(updatedOrders);
      
      showToast2('Order marked as completed!', 'success');
    } catch (error) {
      console.error("Error completing order:", error);
      showToast2('Failed to complete order. Please try again.', 'error');
    }
  };

  const openWhatsAppChat = (phoneNumber) => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;
    window.open(whatsappUrl, '_blank');
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });


  // Handle input changes for personal information

  // Handle social profile input changes
  const handleSocialInputChange = (e) => {
    const { name, value } = e.target;
    setFreelancer(prev => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [name]: value
      }
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save all personal information and social profile changes
  const saveAllChanges = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedData = {
        name: freelancer.name,
        email: freelancer.email,
        phone: freelancer.phone,
        location: freelancer.location,
        socialProfiles: freelancer.socialProfiles
      };
      
      await freelancerAPI.updateFreelancer(freelancer._id, updatedData);
      showSuccessToast("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update settings. Please try again.");
      showErrorToast("Failed to update settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      showErrorToast("Please enter your current password");
      return;
    }
   
    if (passwordData.newPassword.length < 8) {
      showErrorToast("New password must be at least 8 characters");
      return;
    }
   
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorToast("New passwords don't match");
      return;
    }
   
    setIsLoading(true);
    setError(null);
   
    try {
      // Use updateFreelancer instead of updatePassword
      await freelancerAPI.updateFreelancer(freelancer._id, {
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword
      });
     
      // Clear password fields after successful update
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
     
      showSuccessToast("Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
     
      // Handle specific error responses
      if (error.response && error.response.status === 401) {
        showErrorToast("Current password is incorrect");
      } else {
        showErrorToast("Failed to update password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const confirmDeleteAccount = () => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteAccount();
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    
    try {
      await freelancerAPI.deleteFreelancer(freelancer._id);
      // Handle successful deletion (redirect to homepage, clear authentication, etc.)
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error("Error deleting account:", error);
      showErrorToast("Failed to delete account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toast notification helpers (assumed these functions exist in your app)
  

  const showErrorToast = (message) => {
    // Implementation depends on your toast notification system
    // Example: toast.error(message);
    console.error("Error:", message);
  };

  const closeProjectDetails = () => {
    setViewingProject(false);
    setProjectDetails(null);
  };

  const logout = async () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  console.log(freelancer);

  if (isLoading) {
    return <div className="loading-spinner">Loading profile data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!freelancer) {
    return <div className="error-message">Profile not found</div>;
  }

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
              <span>
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
  <span className="stat-value" style={{ color: 'white' }}>{completedJobsCount}</span>
  <span className="stat-label" style={{ color: 'white' }}>Jobs Completed</span>
</div>
              <div className="stat">
  {hourlyRateEditMode ? (
    <div className="hourly-rate-edit">
      <input 
        type="text" 
        name="hourlyRate" 
        value={freelancer.hourlyRate} 
        onChange={handleInputChange} 
        className="edit-hourly-rate-input"
      />
      <div className="hourly-rate-actions">
        <button 
          className="save-btn" 
          onClick={async () => {
            try {
              await freelancerAPI.updateFreelancer(freelancer._id, { hourlyRate: freelancer.hourlyRate });
              setHourlyRateEditMode(false);
              showSuccessToast("Hourly rate updated successfully!");
            } catch (error) {
              console.error("Error updating hourly rate:", error);
              showSuccessToast("Failed to update hourly rate. Please try again.");
            }
          }}
        >
          Save
        </button>
        <button 
          className="cancel-btn" 
          onClick={() => setHourlyRateEditMode(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <>
      <span className="stat-value" style={{ color: 'white' }}>
        {freelancer.hourlyRate}
        <button 
          className="edit-hourly-btn" 
          onClick={() => setHourlyRateEditMode(true)}
          style={{ marginLeft: '5px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <FaEdit style={{ fontSize: '14px', color: '#c0c0c0' }} />
        </button>
      </span>
      <span className="stat-label" style={{ color: 'white' }}>Hourly Rate</span>
    </>
  )}
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
         {activeTab === "orders" && (
          <FreelancerOrdersDashboard freelancer={freelancer} />
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
          <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Enter new password" />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" />
        </div>
        <button className="update-password-btn" onClick={handlePasswordUpdate}>Update Password</button>
      </div>
    </div>
    
    <div className="settings-section">
      <h3>Social Profiles</h3>
      <div className="settings-form">
        <div className="form-group social-input">
          <FaLinkedin className="social-icon" />
          <input type="text" name="linkedin" value={freelancer.socialProfiles.linkedin} onChange={handleSocialInputChange} />
        </div>
        <div className="form-group social-input">
          <FaGithub className="social-icon" />
          <input type="text" name="github" value={freelancer.socialProfiles.github} onChange={handleSocialInputChange} />
        </div>
        <div className="form-group social-input">
          <FaGlobe className="social-icon" />
          <input type="text" name="portfolio" value={freelancer.socialProfiles.portfolio} onChange={handleSocialInputChange} />
        </div>
      </div>
    </div>
    
    <div className="settings-buttons">
      <button className="save-changes-btn" onClick={saveAllChanges}>Save All Changes</button>
      <button className="delete-account-btn" onClick={confirmDeleteAccount}>Delete Account</button>
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