import React, { useState, useEffect } from 'react';
import './Login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { freelancerAPI, clientAPI } from './api/api'; // Import both APIs
import { useNavigate } from 'react-router-dom';
import { UserContext } from './components/UserContext';
import { useContext } from 'react';

// Add these styles to your Login.css file or inject them here
const additionalStyles = `
  /* Email validation styles */
  .error-message {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(229, 57, 53, 0.1);
    border-radius: 4px;
    display: flex;
    align-items: center;
    animation: fadeIn 0.3s ease-in-out;
  }

  .error-message::before {
    content: "⚠️";
    margin-right: 0.5rem;
  }

  .help-text {
    color: #546e7a;
    font-size: 0.8rem;
    margin-top: 0.4rem;
    display: block;
    line-height: 1.4;
    padding-left: 0.2rem;
    transition: all 0.3s ease;
  }

  .highlight-domain {
    color: #2196f3;
    font-weight: 500;
  }

  /* Input validation styles */
  input.valid-input {
    border-color: #4caf50 !important;
    background-color: rgba(76, 175, 80, 0.05);
  }

  input.invalid-input {
    border-color: #e53935 !important;
    background-color: rgba(229, 57, 53, 0.05);
  }

  .domain-badge {
    display: inline-block;
    background-color: #e3f2fd;
    color: #1976d2;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.75rem;
    margin-right: 5px;
    margin-bottom: 5px;
  }

  .domain-badges {
    margin-top: 0.5rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Enhanced toast style */
  .toast-message {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Animated focus effect */
  .form-group input:focus {
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    transition: all 0.3s ease;
  }
`;

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
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  
  // Student email domains
  const studentDomains = ['.edu', '.edu.in', '.ac.in', '.ac.uk', '.edu.au', '.edu.ca'];
  
  const navigate = useNavigate();

  // Function to validate student email domains
  const isValidStudentEmail = (email) => {
    if (!email) return false;
    return studentDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  // Check email validity whenever it changes
  useEffect(() => {
    if (!isLogin && userType === 'freelancer' && formData.email) {
      const isValid = isValidStudentEmail(formData.email);
      setEmailValid(isValid);
      
      if (!isValid && formData.email.includes('@')) {
        setEmailError('Please use a valid student email domain');
      } else {
        setEmailError('');
      }
    } else {
      setEmailValid(formData.email.length > 0);
    }
  }, [formData.email, userType, isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset email validation when email is changed
    if (name === 'email') {
      setEmailError('');
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    // Reset form data and errors when toggling
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      companyName: '',
    });
    setEmailError('');
    setEmailValid(false);
  };

  const toggleUserType = (type) => {
    setUserType(type);
    // Reset form data and errors when changing user type
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      companyName: '',
    });
    setEmailError('');
    setEmailValid(false);
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const validateForm = () => {
    // Validate email for freelancer signup
    if (!isLogin && userType === 'freelancer' && !isValidStudentEmail(formData.email)) {
      setEmailError('Please use a valid academic email (.edu, .edu.in, .ac.in, etc.)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      showToastMessage('Please fix the errors in the form', 'error');
      return;
    }
    
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

  // Inject additional styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

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
                placeholder={userType === 'freelancer' && !isLogin ? "Enter your student email" : "Enter your email address"}
                required
                className={
                  formData.email 
                    ? (!isLogin && userType === 'freelancer' 
                        ? (emailValid ? 'valid-input' : (emailError ? 'invalid-input' : '')) 
                        : '') 
                    : ''
                }
              />
              {emailError && <div className="error-message">{emailError}</div>}
              
              {!isLogin && userType === 'freelancer' && (
                <div>
                  <small className="help-text">
                    As a freelancer, you must use a student email to Sign Up
                  </small>
                  {/* <div className="domain-badges">
                    {studentDomains.map((domain, index) => (
                      <span key={index} className="domain-badge">
                        {domain}
                      </span>
                    ))}
                  </div> */}
                </div>
              )}
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