import React, { useState, useEffect } from 'react';
import './css/Login.css';
import { motion, AnimatePresence } from 'framer-motion';
import { freelancerAPI, clientAPI, otpAPI } from './api/api';
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

  /* OTP Step Styles */
  .otp-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
  }

  .otp-icon {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #6c63ff, #3ecfcf);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(108, 99, 255, 0.3);
  }

  .otp-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 8px;
  }

  .otp-subtitle {
    font-size: 0.88rem;
    color: #666;
    text-align: center;
    margin: 0 0 28px;
    line-height: 1.5;
  }

  .otp-subtitle span {
    color: #6c63ff;
    font-weight: 600;
  }

  .otp-inputs {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
  }

  .otp-input-box {
    width: 48px;
    height: 56px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a2e;
    background: #fafafa;
    transition: all 0.2s ease;
    outline: none;
    caret-color: #6c63ff;
  }

  .otp-input-box:focus {
    border-color: #6c63ff;
    background: #f0f0ff;
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.15);
  }

  .otp-input-box.filled {
    border-color: #6c63ff;
    background: #f0f0ff;
  }

  .otp-verify-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6c63ff, #3ecfcf);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 16px;
    letter-spacing: 0.3px;
  }

  .otp-verify-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108, 99, 255, 0.35);
  }

  .otp-verify-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .otp-resend {
    font-size: 0.85rem;
    color: #888;
    text-align: center;
  }

  .otp-resend button {
    background: none;
    border: none;
    color: #6c63ff;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    margin-left: 4px;
    transition: opacity 0.2s;
  }

  .otp-resend button:disabled {
    color: #aaa;
    cursor: default;
  }

  .otp-back-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 0.82rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    padding: 4px 0;
    transition: color 0.2s;
  }

  .otp-back-btn:hover {
    color: #6c63ff;
  }

  .otp-timer {
    color: #e53935;
    font-size: 0.8rem;
    margin-top: 6px;
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

  // OTP state
  const [otpStep, setOtpStep] = useState(false);       // true = show OTP screen
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);   // countdown seconds
  const [pendingFormData, setPendingFormData] = useState(null); // store form data until OTP verified

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Start resend countdown (60s)
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle individual OTP box input
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const updated = [...otpValues];
    updated[index] = value;
    setOtpValues(updated);
    setOtpError('');
    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-box-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      document.getElementById(`otp-box-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otpValues];
    pasted.split('').forEach((ch, i) => { if (i < 6) updated[i] = ch; });
    setOtpValues(updated);
    const nextEmpty = updated.findIndex(v => !v);
    document.getElementById(`otp-box-${nextEmpty === -1 ? 5 : nextEmpty}`)?.focus();
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || !pendingFormData) return;
    try {
      setOtpValues(['', '', '', '', '', '']);
      setOtpError('');
      await otpAPI.sendOTP(pendingFormData.email, pendingFormData.userType);
      startResendTimer();
      showToastMessage('A new OTP has been sent to your email!', 'success');
    } catch {
      showToastMessage('Failed to resend OTP. Please try again.', 'error');
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otpValues.join('');
    if (otpCode.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }
    setOtpLoading(true);
    try {
      await otpAPI.verifyOTP(pendingFormData.email, otpCode);
      // OTP verified — now do actual registration
      await performRegistration(pendingFormData);
    } catch (error) {
      setOtpError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const performRegistration = async (data) => {
    const fullPhoneNumber = data.phoneNumber ? data.countryCode + data.phoneNumber : '';
    try {
      if (data.userType === 'freelancer') {
        const response = await freelancerAPI.register({
          name: data.name,
          email: data.email,
          phone: fullPhoneNumber,
          password: data.password,
          tagline: 'Professional Freelancer',
          bio: 'New to the platform',
          profilePhoto: 'https://i.ibb.co/N6GPXKSt/blank.jpg',
          hourlyRate: '0',
          jobsCompleted: 0,
          location: 'Remote',
          languages: ['English']
        });
        localStorage.setItem('token', response.data.token);
        const userData = {
          id: response.data.freelancer?.id,
          name: response.data.freelancer?.name || data.name,
          email: response.data.freelancer?.email || data.email,
          userType: 'freelancer',
          isLoggedIn: true
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        showToastMessage('✅ Email verified! Welcome to the Freelancer community!');
        localStorage.setItem('newRegistration', 'true');
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        const response = await clientAPI.register({
          email: data.email,
          password: data.password,
          companyName: data.companyName,
          phone: fullPhoneNumber,
          location: { country: 'Remote', city: '' },
          verified: false,
          profilePicture: 'https://i.ibb.co/N6GPXKSt/blank.jpg'
        });
        localStorage.setItem('token', response.data.token);
        const userData = {
          id: response.data.client?.id,
          email: data.email,
          companyName: data.companyName,
          userType: 'client',
          isLoggedIn: true
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        showToastMessage('✅ Email verified! Welcome to the Client community!');
        setTimeout(() => navigate('/client-dashboard'), 1500);
      }
    } catch (error) {
      setOtpStep(false);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.status === 409) errorMessage = 'This email is already registered. Please login instead.';
      else if (error.response?.data?.message) errorMessage = error.response.data.message;
      showToastMessage(errorMessage, 'error');
    }
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
        // Handle signup — send OTP first
        const snapshot = { ...formData, userType };
        setPendingFormData(snapshot);
        await otpAPI.sendOTP(formData.email, userType);
        setOtpStep(true);
        setOtpValues(['', '', '', '', '', '']);
        setOtpError('');
        startResendTimer();
        showToastMessage(`OTP sent to ${formData.email}!`, 'success');
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
          <h1>{isLogin ? 'Welcome Back' : (otpStep ? 'Verify Email' : 'Join Us Today')}</h1>
          <p>{isLogin ? 'Login to access your account' : (otpStep ? 'Enter the OTP sent to your email' : 'Create an account to get started')}</p>
        </div>

        {!otpStep && (
        <div className="toggle-container">
          <div className={`toggle-option ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</div>
          <div className={`toggle-option ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</div>
          <div className="slider" style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}></div>
        </div>
        )}

        {!otpStep && (
        <div className="user-type-toggle">
          <div className={`user-type-option ${userType === 'freelancer' ? 'active' : ''}`} onClick={() => toggleUserType('freelancer')}>
            Freelancer
          </div>
          <div className={`user-type-option ${userType === 'client' ? 'active' : ''}`} onClick={() => toggleUserType('client')}>
            Client
          </div>
        </div>
        )}

        <AnimatePresence mode="wait">
          {otpStep ? (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="auth-form"
            >
              <div className="otp-container">
                <div className="otp-icon">✉️</div>
                <h2 className="otp-title">Check your inbox</h2>
                <p className="otp-subtitle">
                  We've sent a 6-digit OTP to<br />
                  <span>{pendingFormData?.email}</span>
                </p>

                <div className="otp-inputs">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      id={`otp-box-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className={`otp-input-box${val ? ' filled' : ''}`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {otpError && <div className="error-message" style={{ marginBottom: '12px' }}>{otpError}</div>}

                <button
                  type="button"
                  className="otp-verify-btn"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpValues.join('').length < 6}
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                <div className="otp-resend">
                  Didn't receive it?
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0}
                  >
                    Resend OTP
                  </button>
                  {resendTimer > 0 && <div className="otp-timer">Resend in {resendTimer}s</div>}
                </div>

                <button
                  type="button"
                  className="otp-back-btn"
                  onClick={() => { setOtpStep(false); setOtpError(''); }}
                >
                  ← Back to Sign Up
                </button>
              </div>
            </motion.div>
          ) : (
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
                <button type="button" className="forgot-password-btn" onClick={() => { }}>Forgot Password?</button>
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
          )}
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