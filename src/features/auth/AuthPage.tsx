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

  return (
    <div
      className="flex min-h-dvh flex-col px-6 pb-12"
      style={{ background: 'linear-gradient(170deg,#FFF1EC 0%,#F5F5F8 60%)' }}
    >
      {/* Hero: logo + titles */}
      <div className="flex flex-col items-center pt-20 text-center">
        <Logo height={44} />

        <h1 className="mt-6 font-heading text-[2rem] font-extrabold leading-tight tracking-tight text-[#15151A]">
          {currentMode === 'login' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
        </h1>
        <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted">
          {currentMode === 'login'
            ? 'Entre para gerenciar seus racheis.'
            : 'Dívidas entre amigos, simples e sem climão.'}
        </p>
      </div>

      {/* Form — flui logo abaixo do hero */}
      <div className="mt-10">
        {currentMode === 'login' ? (
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
    </div>
  )
}
