// Owner: Dev 1
import axiosClient from './axiosClient'

// Returns the response body, including `data: { id, role, token, ... }`.
export const registerUser = async (userData) => {
  const res = await axiosClient.post('/auth/register', userData)
  return res.data
}

// credentials: { email, password } -> { token, user: { id, role, ... } }
export const loginUser = async (credentials) => {
  const res = await axiosClient.post('/auth/login', credentials)
  return res.data
}

export const logoutUser = async () => {
  const res = await axiosClient.get('/auth/logout', { withCredentials: true })
  return res.data
}