import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7180'

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? API_URL : '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  // Only in browser
  if (typeof window !== 'undefined') {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
  }
  return config
})

// Handle 401 (redirect to login) and 429 (rate limit)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        window.location.href = '/login'
      }
      if (error.response?.status === 429) {
        console.warn('Rate limit hit:', error.config?.url)
      }
    }
    return Promise.reject(error)
  }
)

// Server-side API call helper (for Server Components / Route Handlers)
export function serverApi(token?: string) {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return instance
}
