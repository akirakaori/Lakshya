import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 60000, // 60 seconds for Cloudinary uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token and handle FormData
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CRITICAL FIX: Remove Content-Type for FormData uploads
    // Let axios set it automatically with proper boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Only redirect to login if:
    // 1. It's a 401 error
    // 2. There WAS a token (meaning user was authenticated but token expired)
    // 3. Not already on login page
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('token');
      const isOnLoginPage = window.location.pathname === '/login';
      
      if (hadToken && !isOnLoginPage) {
        // Token expired or invalid - clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('role');
        
        // Preserve current location for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      } else if (hadToken) {
        // Clear storage even on login page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('role');
      }
      // If no token, just let the error propagate (guest user trying protected resource)
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
