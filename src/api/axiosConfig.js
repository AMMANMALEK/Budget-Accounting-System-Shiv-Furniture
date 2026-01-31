import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
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
    const customError = {
      message: 'An unexpected error occurred',
      status: error.response ? error.response.status : 500,
      data: error.response ? error.response.data : null,
    };

    if (error.response) {
      if (error.response.status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        customError.message = 'Unauthorized access. Please login again.';
        // Optional: dispatch a logout action if store is accessible or clear local storage
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        customError.message = 'You do not have permission to perform this action.';
      } else if (error.response.data && error.response.data.message) {
        customError.message = error.response.data.message;
      }
    } else if (error.request) {
      customError.message = 'No response received from server. Please check your internet connection.';
    }

    return Promise.reject(customError);
  }
);

export default client;
