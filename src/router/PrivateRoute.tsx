import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const location = useLocation()

  // RootLayout shows a spinner during init; this is a safety net
  if (isInitializing) return null

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
