import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Logo from '../../components/Logo'

interface AuthPageProps {
  mode?: 'login' | 'register'
}

const BENEFITS = [
  'Grupos e dívidas sempre organizados',
  'Confirmação dupla em cada pagamento',
  'Acerto automático dos saldos entre amigos',
]

export default function AuthPage({ mode = 'login' }: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode)
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const isLogin = currentMode === 'login'

  return (
    <div className="flex min-h-dvh flex-col bg-[#FF6A43] lg:grid lg:grid-cols-2">
      {/* ── Marca: faixa no topo (mobile) · coluna cheia à esquerda (desktop) ── */}
      <div className="flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#FF5436] to-[#FF8A3D] px-8 pt-20 pb-24 text-center text-white lg:min-h-dvh lg:gap-7 lg:px-14 lg:py-16">
        <Logo tone="light" className="h-16 w-auto lg:h-24" />
        <p className="max-w-xs text-[15.5px] font-medium leading-relaxed text-white/95 lg:max-w-md lg:text-xl">
          {isLogin ? 'Que bom te ver de novo.' : 'Dívidas entre amigos, sem climão.'}
        </p>

        {/* Benefícios — só no desktop, para dar corpo à coluna alta */}
        <ul className="mt-4 hidden w-full max-w-sm flex-col gap-3.5 text-left lg:flex">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-3 text-[15px] font-medium text-white/95">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg width="13" height="13" viewBox="0 0 13 11" fill="none">
                  <path d="M1.5 5.5L5 9l6.5-7.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Formulário: folha branca (mobile) · coluna centralizada (desktop) ── */}
      <div className="-mt-[30px] flex flex-1 flex-col rounded-t-[30px] bg-white px-6 pb-7 pt-9 shadow-[0_-10px_34px_rgba(120,40,20,0.10)] lg:mt-0 lg:min-h-dvh lg:justify-center lg:rounded-none lg:px-16 lg:shadow-none">
        <div className="w-full lg:mx-auto lg:max-w-[400px]">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#17181F]">
            {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#8A8A96]">
            {isLogin ? 'Entre para acertar suas contas.' : 'Leva menos de um minuto.'}
          </p>

          <div className="mt-6">
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
        </div>

        {/* Rodapé — ancora a base (mobile) · fica abaixo do form (desktop) */}
        <div className="mt-auto flex justify-center pt-7 text-xs font-medium text-[#B3B3C0] lg:mt-10">
          Rachei · desde 2026
        </div>
      </div>
    </div>
  )
}
