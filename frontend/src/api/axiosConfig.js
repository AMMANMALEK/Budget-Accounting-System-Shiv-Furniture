import axios from 'axios';

// Robust environment variable handling
const getApiBaseUrl = () => {
  // Try usage of import.meta.env (Vite)
  if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Fallback for different environments or if .env is missing
  return 'http://localhost:5000/api';
};

const API_URL = getApiBaseUrl();

console.log('🌐 Axios configured with Base URL:', API_URL);

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
client.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Error parsing user token from localStorage', e);
        localStorage.removeItem('user');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops on login check
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      console.warn('⚠️ 401 Unauthorized - redirecting to login');
      // Clear auth data and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
