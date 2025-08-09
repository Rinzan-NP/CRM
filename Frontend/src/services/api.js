import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to attach JWT token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors and refresh tokens
api.interceptors.response.use(response => {
  return response;
}, (error) => {
  if (error.response.status === 401) {
    // Token has expired; attempt to refresh it
    api.post('/accounts/refresh/', { refresh: localStorage.getItem('refresh') })
      .then((refreshResponse) => {
        // Refreshed token successfully; retry the original request
        localStorage.setItem('token', refreshResponse.data.access);
        localStorage.setItem('refresh', refreshResponse.data.refresh);
        return api(config);
      })
      .catch((refreshError) => {
        // Refresh failed; log out and redirect to login
        console.error('Token refresh failed', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        window.location.href = '/login'; // Redirect to login page
      });
  }
  throw error;
});

export default api;