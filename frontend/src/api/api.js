// api/api.js

import axios from 'axios';

// Create axios instance with base URL from environment variables
const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:5000/api'
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
  addReview: (id, reviewData) => API.post(`/freelancers/${id}/reviews`, reviewData),
  parseResume: (formData) =>
    API.post('/freelancers/parse-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
    API.put(`/jobs/${jobId}/applications/${applicationId}`, statusData),
  // Push a proposal ID into the job's proposals[] array
  addProposalToJob: (jobId, proposalId) => API.post(`/jobs/${jobId}/proposals`, { proposalId }),
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

// Recommendation endpoints
export const recommendationAPI = {
  // Get job recommendations for a freelancer
  getJobRecommendations: (freelancerId, params = {}) =>
    API.get(`/recommendations/jobs/${freelancerId}`, { params }),

  // Get freelancer recommendations for a client
  getFreelancerRecommendations: (clientId, params = {}) =>
    API.get(`/recommendations/freelancers/${clientId}`, { params }),

  // Record user interaction
  recordInteraction: (interactionData) =>
    API.post('/recommendations/interactions', interactionData),

  // Record job view
  recordJobView: (freelancerId, jobId, metadata = {}) =>
    API.post('/recommendations/job-view', { freelancerId, jobId, metadata }),

  // Get interaction history
  getHistory: (userId, limit = 100) =>
    API.get(`/recommendations/history/${userId}`, { params: { limit } }),

  // Get similar users
  getSimilarUsers: (userId, limit = 10) =>
    API.get(`/recommendations/similar-users/${userId}`, { params: { limit } }),

  // Clear cache (admin/testing)
  clearCache: () =>
    API.post('/recommendations/clear-cache')
};

// Upload endpoints (Cloudinary)
export const uploadAPI = {
  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return API.post('/upload/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Proposal endpoints
export const proposalAPI = {
  // Submit a new proposal (freelancer)
  createProposal: (proposalData) => API.post('/proposals', proposalData),

  // Get all proposals for a specific job (client viewing applicants)
  getProposalsByJob: (jobId) => API.get(`/proposals/job/${jobId}`),

  // Get all proposals submitted by a freelancer
  getProposalsByFreelancer: (freelancerId) => API.get(`/proposals/freelancer/${freelancerId}`),

  // Get all proposals received by a client
  getProposalsByClient: (clientId) => API.get(`/proposals/client/${clientId}`),

  // Get a single proposal by ID
  getProposal: (id) => API.get(`/proposals/${id}`),

  // Update proposal status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  updateProposalStatus: (id, status) => API.put(`/proposals/${id}/status`, { status }),

  // Delete / withdraw a proposal
  deleteProposal: (id) => API.delete(`/proposals/${id}`),
};

export const aiAssistantAPI = {
  /**
   * Send a message to the Groq-powered AI assistant.
   * @param {string} message              - User's message
   * @param {Array}  conversationHistory  - [{role, content}] array of prior turns
   * @param {string} userId               - Logged-in user's MongoDB _id (from localStorage user.id)
   * @param {string} userType             - "freelancer" or "client"
   */
  chat: (message, conversationHistory = [], userId = null, userType = null) =>
    API.post('/ai-assistant/chat', { message, conversationHistory, userId, userType }),

  /**
   * Get suggested starter questions based on user type.
   * @param {'Client'|'Freelancer'} userType
   */
  getSuggestions: (userType) =>
    API.get('/ai-assistant/suggestions', { params: { userType } })
};

// ── Invitation API ───────────────────────────────────────────────────────────
export const invitationAPI = {
  sendInvitation: (data) => API.post('/invitations', data),
  getByClient: (clientId, status) =>
    API.get(`/invitations/client/${clientId}`, { params: status ? { status } : {} }),
  getByFreelancer: (freelancerId, status) =>
    API.get(`/invitations/freelancer/${freelancerId}`, { params: status ? { status } : {} }),
  getById: (id) => API.get(`/invitations/${id}`),
  updateStatus: (id, status) => API.put(`/invitations/${id}/status`, { status }),
  deleteInvitation: (id) => API.delete(`/invitations/${id}`),
};

export default API;

// OTP endpoints
export const otpAPI = {
  sendOTP: (email, userType) => API.post('/otp/send', { email, userType }),
  verifyOTP: (email, otp) => API.post('/otp/verify', { email, otp }),
};

// AI Proposal Generator
export const generateProposalAPI = {
  generate: (freelancerId, project) =>
    API.post('/generate-proposal', { freelancerId, project }),
};
