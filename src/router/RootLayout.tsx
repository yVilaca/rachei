import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { useInitAuth } from '../hooks/useInitAuth'

export default function RootLayout() {
  useInitAuth()
  const isInitializing = useAuthStore((s) => s.isInitializing)

  if (isInitializing) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAFC',
        }}
      >
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid #FF5436',
            borderTopColor: 'transparent',
            animation: '_spin 0.7s linear infinite',
          }}
        />
      </div>
    )
  }

  return <Outlet />
}
