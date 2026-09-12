import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../../services/auth.service'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#6B6B76', display: 'block' }
const field: React.CSSProperties = {
  width: '100%', height: 52, borderRadius: 14, border: '1.5px solid #E7E7EE',
  background: '#FAFAFC', padding: '0 16px 0 46px', fontSize: 15, color: '#17181F',
  outline: 'none', fontFamily: 'Poppins, sans-serif', transition: 'border-color .15s, box-shadow .15s, background .15s',
}
const iconWrap: React.CSSProperties = {
  position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
  color: '#B3B3C0', display: 'flex', pointerEvents: 'none',
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const result = await authService.login(email, password)
      const redirect = searchParams.get('redirect') ?? '/dashboard'
      if ('requires2FA' in result) {
        navigate(`/verificar-2fa?redirect=${encodeURIComponent(redirect)}`)
        return
      }
      navigate(redirect, { replace: true })
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { detail?: string } } })?.response?.data
      setError(res?.detail ?? 'E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        .rc-input:focus { border-color:#FF5436; background:#fff; box-shadow:0 0 0 4px rgba(255,84,54,.12); }
        .rc-input::placeholder { color:#ABABBE; }
      `}</style>

      {/* E-mail */}
      <div>
        <label htmlFor="email" style={label}>E-mail</label>
        <div style={{ position: 'relative', marginTop: 7 }}>
          <span style={iconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            id="email" type="email" placeholder="seu@email.com" className="rc-input"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
            autoComplete="email" style={field}
          />
        </div>
      </div>

      {/* Senha */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label htmlFor="password" style={label}>Senha</label>
          <Link to="/esqueci-senha" style={{ fontSize: 13, fontWeight: 600, color: '#FF5436', textDecoration: 'none' }}>
            Esqueci minha senha
          </Link>
        </div>
        <div style={{ position: 'relative', marginTop: 7 }}>
          <span style={iconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="9" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            id="password" type={showPwd ? 'text' : 'password'} placeholder="Sua senha" className="rc-input"
            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
            autoComplete="current-password" style={{ ...field, paddingRight: 46 }}
          />
          <button
            type="button" onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: '#B3B3C0', padding: 0,
            }}
          >
            {showPwd ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.4-1.1" /><path d="m2 2 20 20" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ background: '#FDECEC', color: '#E5484D', fontSize: 13.5, fontWeight: 600, padding: '11px 14px', borderRadius: 12, margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit" disabled={isLoading}
        style={{
          marginTop: 4, height: 54, width: '100%', borderRadius: 14, border: 'none',
          background: isLoading ? '#F0A594' : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
          color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 16,
          cursor: isLoading ? 'default' : 'pointer', boxShadow: '0 10px 22px rgba(255,84,54,0.30)',
        }}
      >
        {isLoading ? 'Entrando…' : 'Entrar'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#8A8A96', margin: '6px 0 0' }}>
        Não tem conta?{' '}
        <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#FF5436', fontSize: 14, fontFamily: 'Poppins, sans-serif', padding: 0 }}>
          Criar agora
        </button>
      </p>
    </form>
  )
}
