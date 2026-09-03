import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { API_BASE_URL } from './env'

const BASE_URL = API_BASE_URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // envia cookie HttpOnly do refresh token em toda requisição
})

// Deduplicates concurrent 401s — only one refresh request fires at a time
let refreshPromise: Promise<string> | null = null

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Endpoints em que um 401 é um erro legítimo de credencial — NÃO tentar refresh
// (senão o login com senha errada vira um reload silencioso, sem mensagem).
const NO_REFRESH_ON_401 = ['/api/auth/login/', '/api/auth/2fa/challenge/']

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const skipRefresh = NO_REFRESH_ON_401.some((u) => original?.url?.includes(u))
    if (error.response?.status !== 401 || original._retry || skipRefresh) {
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
  // Cookie HttpOnly é enviado automaticamente (withCredentials=true)
  // Sem body — o refresh token vem do cookie, não do store
  const { data } = await axios.post(
    `${BASE_URL}/api/auth/refresh/`,
    {},
    { withCredentials: true },
  )
  useAuthStore.getState().setAccessToken(data.access)
  return data.access
}

export default api
