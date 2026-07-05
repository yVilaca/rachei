import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../../services/auth.service'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

const INPUT_CLS = [
  'h-12 rounded-2xl border border-[#E4E4EC]',
  'bg-white px-4 text-sm text-[#15151A]',
  'placeholder:text-[#ABABBE] shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
  'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
  'transition-shadow',
].join(' ')

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLS}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted">
            Senha
          </Label>
          <Link to="/esqueci-senha" className="text-xs font-semibold text-brand">
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLS}
          disabled={isLoading}
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light font-extrabold text-white shadow-float"
      >
        {isLoading ? 'Entrando…' : 'Entrar'}
      </Button>

      <p className="text-center text-sm text-muted">
        Não tem conta?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-bold text-brand">
          Criar agora
        </button>
      </p>
    </form>
  )
}
