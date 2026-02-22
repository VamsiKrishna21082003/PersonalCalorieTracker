import axios from 'axios';

// Helper function to normalize API URL (remove trailing slashes)
const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - let axios set it automatically with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      
      // Clear token
      localStorage.removeItem('token');
      
      // Only redirect if not already on login/register page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // Show user-friendly message before redirect
        if (errorCode === 'TOKEN_EXPIRED') {
          alert('Your session has expired. Please login again.');
        } else {
          alert(errorMessage);
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
