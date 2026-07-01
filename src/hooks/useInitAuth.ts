import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { authService } from '../services/auth.service'

export function useInitAuth() {
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setInitializing = useAuthStore((s) => s.setInitializing)

  useEffect(() => {
    if (!refreshToken) {
      setInitializing(false)
      return
    }

    authService
      .me()
      .then((user) => setUser(user))
      .catch(() => clearAuth())
      .finally(() => setInitializing(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
