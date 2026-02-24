import React, { useState, useEffect } from 'react';
import './css/Login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { freelancerAPI, clientAPI } from './api/api';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './components/UserContext';
import { useContext } from 'react';

const additionalStyles = `
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

  .toast-message {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .form-group input:focus {
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    transition: all 0.3s ease;
  }
`;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('freelancer');
  const { setUser } = useContext(UserContext);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    countryCode: '+91',
    companyName: '',
    password: '',
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);

  const studentDomains = ['.edu', '.edu.in', '.ac.in', '.ac.uk', '.edu.au', '.edu.ca'];

  const navigate = useNavigate();

  const isValidStudentEmail = (email) => {
    if (!email) return false;
    return studentDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    return phone.length >= 7 && phone.length <= 15 && /^\d+$/.test(phone);
  };

  // Fixed email validation logic
  useEffect(() => {
    if (formData.email) {
      if (!isLogin && userType === 'freelancer') {
        // Only validate student email for freelancer signup
        const isValid = isValidStudentEmail(formData.email);
        setEmailValid(isValid);

        if (!isValid && formData.email.includes('@')) {
          setEmailError('Please use a valid student email domain');
        } else {
          setEmailError('');
        }
      } else {
        // For login or client signup, just validate email format
        setEmailValid(isValidEmail(formData.email));
        setEmailError('');
      }
    } else {
      setEmailValid(false);
      setEmailError('');
    }
  }, [formData.email, userType, isLogin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCountryDropdown && !event.target.closest('.form-group')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow digits for phone number
    if (name === 'phoneNumber') {
      if (value && !/^\d*$/.test(value)) {
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      countryCode: '+91',
      password: '',
      companyName: '',
    });
    setEmailError('');
    setEmailValid(false);
  };

  const toggleUserType = (type) => {
    setUserType(type);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      countryCode: '+91',
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
    // Validate email
    if (!isValidEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    // Validate student email for freelancer signup
    if (!isLogin && userType === 'freelancer' && !isValidStudentEmail(formData.email)) {
      setEmailError('Please use a valid academic email (.edu, .edu.in, .ac.in, etc.)');
      return false;
    }

    // Validate phone number for signup
    if (!isLogin && formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      showToastMessage('Please enter a valid phone number (7-15 digits)', 'error');
      return false;
    }

    // Validate password length
    if (formData.password.length < 6) {
      showToastMessage('Password must be at least 6 characters long', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle login
        let response;

        if (userType === 'freelancer') {
          response = await freelancerAPI.login({
            email: formData.email,
            password: formData.password
          });

          localStorage.setItem('token', response.data.token);

          const userData = {
            id: response.data.freelancer?.id,
            name: response.data.freelancer?.name,
            email: response.data.freelancer?.email || formData.email,
            userType: 'freelancer',
            isLoggedIn: true
          };

          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          showToastMessage(`Welcome back, ${response.data.freelancer?.name || 'freelancer'}!`);
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          response = await clientAPI.login({
            email: formData.email,
            password: formData.password
          });

          localStorage.setItem('token', response.data.token);

          const userData = {
            id: response.data.client?.id,
            companyName: response.data.client?.companyName,
            email: response.data.client?.email || formData.email,
            userType: 'client',
            isLoggedIn: true
          };

          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          showToastMessage(`Welcome back, ${response.data.client?.companyName || 'client'}!`);

          setTimeout(() => {
            navigate('/client-dashboard');
          }, 1500);
        }
      } else {
        // Handle signup
        const fullPhoneNumber = formData.phoneNumber ? formData.countryCode + formData.phoneNumber : '';

        if (userType === 'freelancer') {
          const response = await freelancerAPI.register({
            name: formData.name,
            email: formData.email,
            phone: fullPhoneNumber,
            password: formData.password,
            tagline: 'Professional Freelancer',
            bio: 'New to the platform',
            profilePhoto: 'https://via.placeholder.com/150',
            hourlyRate: '0',
            jobsCompleted: 0,
            location: 'Remote',
            languages: ['English']
          });

          localStorage.setItem('token', response.data.token);

          const userData = {
            id: response.data.freelancer?.id,
            name: response.data.freelancer?.name || formData.name,
            email: response.data.freelancer?.email || formData.email,
            userType: 'freelancer',
            isLoggedIn: true
          };

          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          showToastMessage('Registration successful! Welcome to our Freelancer community!');
          localStorage.setItem('newRegistration', 'true');
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          // Client registration
          const response = await clientAPI.register({
            email: formData.email,
            password: formData.password,
            companyName: formData.companyName,
            phone: fullPhoneNumber,
            location: {
              country: 'Remote',
              city: ''
            },
            verified: false,
            profilePicture: 'default-profile.jpg'
          });

          localStorage.setItem('token', response.data.token);

          const userData = {
            id: response.data.client?.id,
            email: formData.email,
            companyName: formData.companyName,
            userType: 'client',
            isLoggedIn: true
          };

          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          showToastMessage('Registration successful! Welcome to our Client community!');

          setTimeout(() => {
            navigate('/client-dashboard');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);

      let errorMessage = 'An error occurred. Please try again.';

      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          `Error: ${error.response.status}`;

        if (error.response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (error.response.status === 409) {
          errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.response.status === 404) {
          errorMessage = 'Account not found. Please sign up first.';
        }
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      showToastMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const countryOptions = [
    { code: '+1', country: 'US/CA', flag: 'us' },
    { code: '+44', country: 'UK', flag: 'gb' },
    { code: '+91', country: 'IN', flag: 'in' },
    { code: '+61', country: 'AU', flag: 'au' },
    { code: '+81', country: 'JP', flag: 'jp' },
    { code: '+86', country: 'CN', flag: 'cn' },
    { code: '+49', country: 'DE', flag: 'de' },
    { code: '+33', country: 'FR', flag: 'fr' },
    { code: '+39', country: 'IT', flag: 'it' },
    { code: '+34', country: 'ES', flag: 'es' },
    { code: '+7', country: 'RU', flag: 'ru' },
    { code: '+55', country: 'BR', flag: 'br' },
    { code: '+52', country: 'MX', flag: 'mx' },
    { code: '+27', country: 'ZA', flag: 'za' },
    { code: '+234', country: 'NG', flag: 'ng' },
    { code: '+20', country: 'EG', flag: 'eg' },
    { code: '+82', country: 'KR', flag: 'kr' },
    { code: '+65', country: 'SG', flag: 'sg' },
    { code: '+60', country: 'MY', flag: 'my' },
    { code: '+62', country: 'ID', flag: 'id' },
    { code: '+63', country: 'PH', flag: 'ph' },
    { code: '+66', country: 'TH', flag: 'th' },
    { code: '+84', country: 'VN', flag: 'vn' },
    { code: '+92', country: 'PK', flag: 'pk' },
    { code: '+880', country: 'BD', flag: 'bd' },
    { code: '+94', country: 'LK', flag: 'lk' },
    { code: '+977', country: 'NP', flag: 'np' },
    { code: '+971', country: 'AE', flag: 'ae' },
    { code: '+966', country: 'SA', flag: 'sa' },
    { code: '+90', country: 'TR', flag: 'tr' },
    { code: '+31', country: 'NL', flag: 'nl' },
    { code: '+46', country: 'SE', flag: 'se' },
    { code: '+47', country: 'NO', flag: 'no' },
    { code: '+45', country: 'DK', flag: 'dk' },
    { code: '+358', country: 'FI', flag: 'fi' },
    { code: '+41', country: 'CH', flag: 'ch' },
    { code: '+43', country: 'AT', flag: 'at' },
    { code: '+32', country: 'BE', flag: 'be' },
    { code: '+351', country: 'PT', flag: 'pt' },
    { code: '+30', country: 'GR', flag: 'gr' },
    { code: '+48', country: 'PL', flag: 'pl' },
    { code: '+420', country: 'CZ', flag: 'cz' },
    { code: '+36', country: 'HU', flag: 'hu' },
    { code: '+40', country: 'RO', flag: 'ro' },
    { code: '+64', country: 'NZ', flag: 'nz' },
    { code: '+353', country: 'IE', flag: 'ie' },
    { code: '+54', country: 'AR', flag: 'ar' },
    { code: '+56', country: 'CL', flag: 'cl' },
    { code: '+57', country: 'CO', flag: 'co' },
    { code: '+51', country: 'PE', flag: 'pe' },
    { code: '+58', country: 'VE', flag: 've' }
  ];

  const getCurrentFlag = () => {
    const current = countryOptions.find(opt => opt.code === formData.countryCode);
    return current?.flag || 'in';
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
                      : (emailValid ? 'valid-input' : ''))
                    : ''
                }
              />
              {emailError && <div className="error-message">{emailError}</div>}

              {!isLogin && userType === 'freelancer' && (
                <small className="help-text">
                  As a freelancer, you must use a student email to Sign Up
                </small>
              )}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', width: '140px' }}>
                    <div
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      style={{
                        width: '100%',
                        padding: '16px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={`https://flagcdn.com/w40/${getCurrentFlag()}.png`}
                        alt="flag"
                        style={{
                          width: '24px',
                          height: '18px',
                          objectFit: 'cover',
                          borderRadius: '2px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <span>{formData.countryCode || '+91'}</span>
                      <svg
                        style={{
                          marginLeft: 'auto',
                          width: '16px',
                          height: '16px',
                          transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>

                    {showCountryDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          maxHeight: '250px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        {countryOptions.map((item) => (
                          <div
                            key={item.code}
                            onClick={() => {
                              setFormData({ ...formData, countryCode: item.code });
                              setShowCountryDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              backgroundColor: formData.countryCode === item.code ? '#f0f7ff' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.countryCode === item.code ? '#f0f7ff' : 'transparent'}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${item.flag}.png`}
                              alt={item.country}
                              style={{
                                width: '24px',
                                height: '18px',
                                objectFit: 'cover',
                                borderRadius: '2px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                            />
                            <span style={{ fontSize: '14px' }}>{item.code} ({item.country})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required={userType === 'freelancer'}
                    style={{ flex: 1 }}
                    maxLength="15"
                  />
                </div>
                {/* <small className="help-text" style={{ marginTop: '0.5rem', display: 'block', color: '#666' }}>
                  Select your country code and enter your phone number
                </small> */}
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
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                required
                minLength="6"
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