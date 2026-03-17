import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
}

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = (config.headers ?? {}) as Record<string, string>
    delete headers['Content-Type']
    delete headers['content-type']
    config.headers = headers as any
  }

  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosError['config'] & {
      _retry?: boolean
    }

    const url = originalRequest?.url ?? ''
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/refresh')

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true

      try {
        const csrfToken = getCookie('refresh_csrf')
        if (!csrfToken) throw new Error('Missing refresh csrf cookie')

        const refreshResponse = await refreshClient.post<{ access_token: string }>(
          '/auth/refresh',
          { csrf_token: csrfToken },
        )

        const { user, setAuth, logout } = useAuthStore.getState()
        if (!user) {
          logout()
          return Promise.reject(error)
        }

        setAuth(user, refreshResponse.data.access_token)

        const headers = (originalRequest.headers ?? {}) as Record<string, string>
        headers.Authorization = `Bearer ${refreshResponse.data.access_token}`
        originalRequest.headers = headers as any

        return apiClient(originalRequest)
      } catch {
        useAuthStore.getState().logout()
      }
    } else if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)

export default apiClient
