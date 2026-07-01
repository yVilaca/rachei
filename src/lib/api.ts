import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Deduplicates concurrent 401s — only one refresh request fires at a time
let refreshPromise: Promise<string> | null = null

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const newAccess = await refreshPromise
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch {
      useAuthStore.getState().clearAuth()
      window.location.replace('/login')
      return Promise.reject(error)
    }
  }
)

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState()
  if (!refreshToken) throw new Error('no-refresh-token')

  // Plain axios (no interceptors) to avoid infinite retry loops
  const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
    refresh: refreshToken,
  })
  setTokens(data.access, data.refresh ?? refreshToken)
  return data.access
}

export default api
