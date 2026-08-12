import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Gateway port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors (like 401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 Unauthorized or 403 Forbidden
      if (error.response.status === 401 || error.response.status === 403) {
        // Clear auth data and potentially redirect
        localStorage.removeItem('token');
        // Let the application handle redirect via context/state rather than forcing reload
        window.dispatchEvent(new Event('unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
