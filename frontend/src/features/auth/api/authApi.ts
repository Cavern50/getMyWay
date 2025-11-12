import axios from 'axios'
import { HOST } from './constants'

const login = async (data: { email: string, password: string }) => {
  const response = await axios.post(`${HOST}/api/auth/login`, data)
  return response.data  // { token, user, _id }
}

const register = async (data: { name: string, email: string, password: string }) => {
  const response = await axios.post(`${HOST}/api/auth/register`, data)
  return response.data
}

export const authApi = {
  login,
  register
}