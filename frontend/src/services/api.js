import axios from 'axios';

// Get the API base URL from environment variable (set by Netlify or .env in dev)
// Vite automatically prefixes VITE_ env vars with import.meta.env
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL;
  
  // Log for debugging (visible in browser console)
  console.log('[API] VITE_API_BASE_URL =', envURL);
  
  if (envURL) {
    const baseURL = `${envURL}/api`;
    console.log('[API] Using baseURL:', baseURL);
    return baseURL;
  }
  
  // Fallback for local development (relative path proxies to localhost:5000)
  console.log('[API] Using relative path fallback: /api');
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message;
    if (message && typeof message !== 'string') {
      error.response.data.message = typeof message === 'object'
        ? JSON.stringify(message)
        : String(message);
    }

    if (error.response && error.response.status === 401) {
      // Clear token and user info on auth error
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      
      // If we are not already on the login page, redirect
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
