// Owner: Dev 1
import axiosClient from './axiosClient'

// userData: { name, email, tel, password, role }
export const registerUser = async (userData) => {
  const res = await axiosClient.post('/auth/register', userData)
  return res.data
}

// credentials: { email, password } -> { token, user: { id, role, ... } }
export const loginUser = async (credentials) => {
  const res = await axiosClient.post('/auth/login', credentials)
  return res.data
}

// Clears localStorage only. In components use useAuth().clearSession()
// so React state updates too.
export const logoutUser = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}