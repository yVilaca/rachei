import axios from 'axios'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { authService } from '../services/auth.service'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function useInitAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setInitializing = useAuthStore((s) => s.setInitializing)

  useEffect(() => {
    // Refresh token vive no cookie HttpOnly — tenta renovar o access token silenciosamente.
    // Usa axios direto (sem interceptores) para evitar loop: se o refresh falhar com 401,
    // o interceptor de api.ts tentaria chamar doRefresh() novamente → recursão infinita.
    axios
      .post(`${BASE_URL}/api/auth/refresh/`, {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.access)
        return authService.me()
      })
      .then((user) => setUser(user))
      .catch(() => clearAuth())
      .finally(() => setInitializing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
