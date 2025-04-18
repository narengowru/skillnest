// api/api.js

import axios from 'axios';

// Create axios instance with base URL from environment variables
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Add request interceptor for auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for debugging
API.interceptors.response.use((response) => {
  console.log(`API Response from ${response.config.url}:`, response.data);
  return response;
}, (error) => {
  console.error('API Error:', error.response?.data || error.message);
  return Promise.reject(error);
});

// Freelancer endpoints
export const freelancerAPI = {
  register: (freelancerData) => API.post('/freelancers/register', freelancerData),
  login: (credentials) => API.post('/freelancers/login', credentials),
  getAllFreelancers: () => API.get('/freelancers'),
  getFreelancer: (id) => API.get(`/freelancers/${id}`),
  updateFreelancer: (id, data) => API.put(`/freelancers/${id}`, data),
  deleteFreelancer: (id) => API.delete(`/freelancers/${id}`),
  addReview: (id, reviewData) => API.post(`/freelancers/${id}/reviews`, reviewData)
};

// Job endpoints
export const jobAPI = {
  getAllJobs: () => API.get('/jobs'),
  getJob: (id) => API.get(`/jobs/${id}`),
  createJob: (jobData) => API.post('/jobs', jobData),
  updateJob: (id, jobData) => API.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => API.delete(`/jobs/${id}`),
  applyToJob: (id, applicationData) => API.post(`/jobs/${id}/apply`, applicationData),
  updateApplicationStatus: (jobId, applicationId, statusData) => 
    API.put(`/jobs/${jobId}/applications/${applicationId}`, statusData)
};

export default API;