import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Logo from '../../components/Logo'

interface AuthPageProps {
  mode?: 'login' | 'register'
}

export default function AuthPage({ mode = 'login' }: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode)
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const isLogin = currentMode === 'login'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#FF6A43' }}>
      {/* Faixa coral: marca + promessa */}
      <div style={{
        background: 'linear-gradient(155deg,#FF5436 0%,#FF8A3D 100%)',
        padding: '82px 28px 88px', textAlign: 'center', color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo tone="light" height={46} />
        </div>
        <p style={{ marginTop: 18, fontSize: 15.5, fontWeight: 500, lineHeight: 1.5, opacity: 0.95 }}>
          {isLogin ? 'Que bom te ver de novo.' : 'Dívidas entre amigos, sem climão.'}
        </p>
      </div>

      {/* Folha branca sobe por cima da faixa */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', background: '#fff',
        borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30,
        padding: '34px 26px 28px', boxShadow: '0 -10px 34px rgba(120,40,20,0.10)',
      }}>
        <h1 style={{
          fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24,
          letterSpacing: '-0.02em', color: '#17181F', margin: 0,
        }}>
          {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: '#8A8A96', lineHeight: 1.5 }}>
          {isLogin ? 'Entre para acertar suas contas.' : 'Leva menos de um minuto.'}
        </p>

        <div style={{ marginTop: 26 }}>
          {isLogin ? (
            <LoginForm
              onSwitchToRegister={() => {
                setCurrentMode('register')
                navigate('/cadastro', { replace: true })
              }}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => {
                setCurrentMode('login')
                navigate('/login', { replace: true })
              }}
            />
          )}
        </div>

        {/* Confiança — ancora a base da folha e reforça segurança */}
        <div style={{
          marginTop: 'auto', paddingTop: 28, display: 'flex', gap: 7,
          alignItems: 'center', justifyContent: 'center', color: '#B3B3C0', fontSize: 12.5, fontWeight: 500,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          Protegido com criptografia e 2FA
        </div>
      </div>
    </div>
  )
}
