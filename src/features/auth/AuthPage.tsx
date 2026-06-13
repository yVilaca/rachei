import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

interface AuthPageProps {
  mode?: 'login' | 'register'
}

export default function AuthPage({ mode = 'login' }: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode)
  const navigate = useNavigate()

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: 'linear-gradient(170deg,#FFF1EC 0%,#F5F5F8 46%)' }}
    >
      {/* Logo hero */}
      <div className="flex flex-col items-center px-8 pt-16 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl font-extrabold text-white shadow-hero"
          style={{ background: 'linear-gradient(135deg,#FF5436,#FF9A3D)', fontFamily: '"Bricolage Grotesque"' }}
        >
          R
        </div>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-[#15151A]">
          Rachei
        </h1>
        <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted">
          Dívidas entre amigos, simples e sem climão.
        </p>
      </div>

      {/* Form card */}
      <div className="mt-auto px-6 pb-10">
        <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {currentMode === 'login' ? (
            <LoginForm onSwitchToRegister={() => {
              setCurrentMode('register')
              navigate('/cadastro', { replace: true })
            }} />
          ) : (
            <RegisterForm onSwitchToLogin={() => {
              setCurrentMode('login')
              navigate('/login', { replace: true })
            }} />
          )}
        </div>
      </div>
    </div>
  )
}
