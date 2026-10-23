import axios from 'axios'

const client = axios.create({
  baseURL: '/api'
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('mh_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')
    const isPublic = url.includes('/public/')

    if (status === 401 && !isAuthRequest && !isPublic) {
      localStorage.removeItem('mh_token')
      localStorage.removeItem('mh_merchant')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default client
