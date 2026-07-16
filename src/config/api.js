import axios from 'axios';

// For local development, backend runs on port 8087.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8087/api';

// In-memory access token storage for security
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial to send refresh token cookies with requests
});

// Request Interceptor: Attach bearer token to authorization header
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and trigger token refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop of refresh attempts
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      try {
        // Attempt to refresh the access token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired: clear local auth and redirect to login
        setAccessToken(null);
        window.dispatchEvent(new Event('auth-logout-triggered'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
