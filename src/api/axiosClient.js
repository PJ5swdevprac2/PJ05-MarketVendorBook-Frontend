import axios from 'axios';

// VITE_API_BASE_URL includes /api/v1 (e.g. http://localhost:5000/api/v1)
// so endpoints below are written WITHOUT the prefix: '/auth/login', '/spots', '/bookings'
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isLogoutRequest = error.config?.url?.includes('/auth/logout');
    if (error.response?.status === 401 && !isLoginRequest && !isLogoutRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;