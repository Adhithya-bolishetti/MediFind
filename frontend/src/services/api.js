import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
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

// Response interceptor to handle errors.
// Only 401 (invalid/expired token) should log the user out. 403 means the
// request is authenticated but forbidden — e.g. a new doctor checking their
// profile status before onboarding — and must NOT wipe the session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
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
