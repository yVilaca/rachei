import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'
import App from './App'
import { initSentry, Sentry } from './lib/sentry'

initSentry()

function ErrorFallback() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24,
      textAlign: 'center', fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, color: '#fff',
      }}>!</div>
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 20, color: '#15151A' }}>
        Algo deu errado
      </div>
      <div style={{ fontSize: 13.5, color: '#6B6B76', maxWidth: 300, lineHeight: 1.5 }}>
        Já registramos o problema. Tente recarregar a página.
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8, padding: '12px 20px', borderRadius: 14, border: 'none',
          cursor: 'pointer', fontWeight: 800, fontSize: 14,
          background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', color: '#fff',
        }}
      >
        Recarregar
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
