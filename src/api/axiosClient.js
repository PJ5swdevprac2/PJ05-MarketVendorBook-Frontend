// SHARED FILE (Dev 1 + Dev 2) - tell each other before editing.
import axios from 'axios'

// VITE_API_BASE_URL already includes /api  (e.g. http://localhost:3000/api)
// so endpoints below are written WITHOUT the /api prefix: '/auth/login', '/spots', '/bookings'
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every request automatically.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Expired/invalid token -> clear session and go to /login.
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export default axiosClient