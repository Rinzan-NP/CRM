import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue = [];
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 5000; // 5 seconds between refresh attempts

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
}, async (error) => {
  const originalRequest = error.config;

  // If the error is not 401 or we're already refreshing, reject
  if (error.response?.status !== 401 || originalRequest._retry) {
    return Promise.reject(error);
  }

  // Rate limiting: don't attempt refresh too frequently
  const now = Date.now();
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
    console.log('Refresh attempt blocked by rate limiting');
    return Promise.reject(error);
  }

  // If we're already refreshing, queue this request
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(token => {
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return api(originalRequest);
    }).catch(err => {
      return Promise.reject(err);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;
  lastRefreshAttempt = now;

  const refreshToken = localStorage.getItem('refresh');
  const accessToken = localStorage.getItem('token');
  
  // If no tokens exist, don't try to refresh - just redirect to login
  if (!refreshToken || !accessToken) {
    processQueue(new Error('No tokens available'), null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    // Don't redirect if we're already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

  try {
    // Create a separate axios instance for refresh to avoid interceptor loop
    const refreshApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const refreshResponse = await refreshApi.post('/accounts/refresh/', { 
      refresh: refreshToken 
    });

    const { access, refresh } = refreshResponse.data;
    
    // Update tokens in localStorage
    localStorage.setItem('token', access);
    if (refresh) {
      localStorage.setItem('refresh', refresh);
    }

    // Update the original request headers
    originalRequest.headers['Authorization'] = `Bearer ${access}`;
    
    // Process queued requests
    processQueue(null, access);
    
    // Retry the original request
    return api(originalRequest);
    
  } catch (refreshError) {
    // Refresh failed, clear tokens and redirect to login
    console.error('Token refresh failed:', refreshError);
    processQueue(refreshError, null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    // Don't redirect if we're already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
});

export default api;