import React, { useState, useEffect } from 'react';
import './Login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { freelancerAPI, clientAPI } from './api/api'; // Import both APIs
import { useNavigate } from 'react-router-dom';
import { UserContext } from './components/UserContext';
import { useContext } from 'react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('freelancer'); // 'freelancer' or 'client'
  const { setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '', // For client signup
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Reset form data when toggling
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      companyName: '',
    });
  };

  const toggleUserType = (type) => {
    setUserType(type);
    // Reset form data when changing user type
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      companyName: '',
    });
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle login with API based on user type
        if (formData.email && formData.password) {
          let response;
          
          if (userType === 'freelancer') {
            response = await freelancerAPI.login({
              email: formData.email,
              password: formData.password
            });
            
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
              id: response.data.freelancer.id,
              name: response.data.freelancer.name,
              email: response.data.freelancer.email,
              userType: 'freelancer',
              isLoggedIn: true
            }));
          } else {
            response = await clientAPI.login({
              email: formData.email,
              password: formData.password
            });
            
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            
            // Check if client info is included in response
            if (response.data.client) {
              localStorage.setItem('user', JSON.stringify({
                id: response.data.client.id,
                companyName: response.data.client.companyName,
                email: response.data.client.email,
                userType: 'client',
                isLoggedIn: true
              }));
            } else {
              // If client info is not provided, store minimal information
              localStorage.setItem('user', JSON.stringify({
                email: formData.email,
                userType: 'client',
                isLoggedIn: true
              }));
            }
          }
          
          showToastMessage(`Login successful! Welcome back, ${userType === 'freelancer' ? 'freelancer' : 'client'}!`);
          // Redirect to appropriate dashboard after successful login
          setTimeout(() => {
            setUser(JSON.parse(localStorage.getItem('user')));
            navigate(userType === 'freelancer' ? '/profile' : '/client-dashboard');
          }, 1500);
        }
      } else {
        // Handle signup with API based on user type
        if (userType === 'freelancer') {
          if (formData.name && formData.email && formData.phone && formData.password) {
            const response = await freelancerAPI.register({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
              // Add other required fields with default values
              tagline: 'Professional Freelancer',
              bio: 'New to the platform',
              profilePhoto: 'https://via.placeholder.com/150',
              hourlyRate: '0',
              jobsCompleted: 0,
              location: 'Remote',
              languages: ['English']
            });
            
            // Store token and user data
            localStorage.setItem('token', response.data.token);
            
            // Check if freelancer info is included in response
            if (response.data.freelancer) {
              localStorage.setItem('user', JSON.stringify({
                id: response.data.freelancer.id,
                name: response.data.freelancer.name,
                email: response.data.freelancer.email,
                userType: 'freelancer',
                isLoggedIn: true
              }));
            } else {
              // If freelancer info is not provided, store minimal information
              localStorage.setItem('user', JSON.stringify({
                name: formData.name,
                email: formData.email,
                userType: 'freelancer',
                isLoggedIn: true
              }));
            }
            
            showToastMessage('Registration successful! Welcome to our Freelancer community!');
            // Redirect to freelancer dashboard after successful registration
            setTimeout(() => {
              setUser(JSON.parse(localStorage.getItem('user')));
              navigate('/profile');
            }, 1500);
          }
        } else {
          // Client registration
          if (formData.email && formData.password && formData.companyName) {
            const response = await clientAPI.register({
              email: formData.email,
              password: formData.password,
              companyName: formData.companyName,
              phone: formData.phone || '',
              location: {
                country: 'Remote',
                city: ''
              },
              verified: false,
              profilePicture: 'default-profile.jpg'
            });
            
            // Store token
            localStorage.setItem('token', response.data.token);
            
            // Store user data with fallback for when client object is not returned
            // THIS IS THE CRITICAL FIX - don't assume client object exists in the response
            localStorage.setItem('user', JSON.stringify({
              email: formData.email,
              companyName: formData.companyName, 
              userType: 'client',
              isLoggedIn: true
            }));
            
            showToastMessage('Registration successful! Welcome to our Client community!');
            
            // Redirect to client dashboard after successful registration
            setTimeout(() => {
              setUser(JSON.parse(localStorage.getItem('user')));
              navigate('/client-dashboard');
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle error messages from the API
      const errorMessage = error.response?.data?.message || 
                          (isLogin ? 'Login failed. Please check your credentials.' : 
                                     'Registration failed. Please try again.');
      
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-illustration">
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
        <div className="floating-element elem1"></div>
        <div className="floating-element elem2"></div>
        <div className="floating-element elem3"></div>
      </div>
      
      <motion.div 
        className="form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="form-header">
          <h1>{isLogin ? 'Welcome Back' : 'Join Us Today'}</h1>
          <p>{isLogin ? 'Login to access your account' : 'Create an account to get started'}</p>
        </div>
        
        <div className="toggle-container">
          <div className={`toggle-option ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</div>
          <div className={`toggle-option ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</div>
          <div className="slider" style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}></div>
        </div>
        
        {/* User Type Toggle */}
        <div className="user-type-toggle">
          <div className={`user-type-option ${userType === 'freelancer' ? 'active' : ''}`} onClick={() => toggleUserType('freelancer')}>
            Freelancer
          </div>
          <div className={`user-type-option ${userType === 'client' ? 'active' : ''}`} onClick={() => toggleUserType('client')}>
            Client
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.form 
            key={`${isLogin ? 'login' : 'signup'}-${userType}`}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="auth-form"
          >
            {/* Freelancer specific fields */}
            {!isLogin && userType === 'freelancer' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            {/* Client specific fields */}
            {!isLogin && userType === 'client' && (
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  required
                />
              </div>
            )}
            
            {/* Common fields */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required={userType === 'freelancer'} // Only required for freelancers
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                required
              />
            </div>
            
            {isLogin && (
              <div className="forgot-password">
                <a href="#">Forgot Password?</a>
              </div>
            )}
            
            <motion.button 
              type="submit"
              className="submit-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 
                (isLogin ? 'Logging in...' : 'Signing up...') : 
                (isLogin ? 'Login' : 'Sign Up')}
            </motion.button>
            
            <div className="form-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" onClick={toggleForm} className="toggle-btn" disabled={isLoading}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
      
      <AnimatePresence>
        {showToast && (
          <motion.div 
            className={`toast-message ${toastType}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="toast-icon">{toastType === 'success' ? '✓' : '!'}</div>
            <p>{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;