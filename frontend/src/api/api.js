// api/api.js

import axios from 'axios';

// Create axios instance with base URL from environment variables
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

console.log('BACKEND URL: ', process.env.REACT_APP_API_URL);

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

// Order endpoints
export const orderAPI = {
  // Core order operations
  createOrder: (orderData) => API.post('/orders', orderData),
  getAllOrders: (filters) => API.get('/orders', { params: filters }),
  getOrder: (id) => API.get(`/orders/${id}`),
  updateOrder: (id, orderData) => API.put(`/orders/${id}`, orderData),
  
  // Order status management
  cancelOrder: (id, cancelData) => API.put(`/orders/${id}/cancel`, cancelData),
  completeOrder: (id) => API.put(`/orders/${id}/complete`),
  
  // Milestone management
  addMilestone: (id, milestoneData) => API.post(`/orders/${id}/milestones`, milestoneData),
  updateMilestone: (orderId, milestoneId, milestoneData) => API.put(`/orders/${orderId}/milestones/${milestoneId}`, milestoneData),
  
  // Revision management
  requestRevision: (id, revisionData) => API.post(`/orders/${id}/revisions`, revisionData),
  completeRevision: (orderId, revisionId, revisionData) => API.put(`/orders/${orderId}/revisions/${revisionId}`, revisionData),
  
  // Communication
  addMessage: (id, messageData) => API.post(`/orders/${id}/messages`, messageData),
  markMessagesAsRead: (id) => API.put(`/orders/${id}/messages/read`),
  
  // Dispute management
  createDispute: (id, disputeData) => API.post(`/orders/${id}/disputes`, disputeData),
  resolveDispute: (orderId, disputeId, resolutionData) => API.put(`/orders/${orderId}/disputes/${disputeId}`, resolutionData),
  
  // Review management
  addReview: (id, reviewData) => API.post(`/orders/${id}/reviews`, reviewData),
  
  // Attachments
  uploadAttachment: (id, attachmentData) => {
    const formData = new FormData();
    for (const key in attachmentData) {
      formData.append(key, attachmentData[key]);
    }
    return API.post(`/orders/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Helper methods
  calculateProgress: (order) => {
    if (!order.milestones || order.milestones.length === 0) return 0;
    const completedMilestones = order.milestones.filter(
      milestone => milestone.status === 'approved'
    ).length;
    return Math.round((completedMilestones / order.milestones.length) * 100);
  },
  
  isOverdue: (order) => {
    if (!order.dueDate) return false;
    if (['completed', 'canceled', 'disputed'].includes(order.status)) return false;
    return new Date(order.dueDate) < new Date();
  },
  
  getProjectDuration: (order) => {
    if (!order.dueDate) return null;
    const startDate = order.startDate || order.createdAt;
    const millisPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((new Date(order.dueDate) - new Date(startDate)) / millisPerDay);
  }
};

// Client endpoints
export const clientAPI = {
  // Authentication
  register: (clientData) => API.post('/clients/register', clientData),
  login: (credentials) => API.post('/clients/login', credentials),
  
  // Client management
  getAllClients: () => API.get('/clients'),
  getClient: (id) => API.get(`/clients/${id}`),
  updateClient: (id, clientData) => API.put(`/clients/${id}`, clientData),
  deleteClient: (id) => API.delete(`/clients/${id}`),
  
  // Dashboard and profile
  getDashboard: () => API.get('/clients/dashboard'),
  uploadProfilePicture: (imageFile) => {
    const formData = new FormData();
    formData.append('profilePicture', imageFile);
    return API.post('/clients/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Reviews
  addReview: (reviewData) => API.post('/clients/review', reviewData),
  
  // Helper methods
  getClientRating: (client) => {
    if (!client || !client.reviews || client.reviews.length === 0) return 0;
    const totalRating = client.reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / client.reviews.length).toFixed(1);
  },
  
  getActiveOrders: (client) => {
    if (!client || !client.orders) return [];
    return client.orders.filter(order => 
      !['completed', 'canceled', 'disputed'].includes(order.status)
    );
  },
  
  getVerificationStatus: (client) => {
    if (!client) return 'Unverified';
    return client.verified ? 'Verified' : 'Unverified';
  },
  
  getClientSince: (client) => {
    if (!client || !client.memberSince) return '';
    const date = new Date(client.memberSince);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
  }
};

export default API;