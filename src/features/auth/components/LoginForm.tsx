import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../../services/auth.service'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

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
      await authService.login(email, password)
      const redirect = searchParams.get('redirect') ?? '/dashboard'
      navigate(redirect, { replace: true })
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { detail?: string } } })?.response?.data
      setError(res?.detail ?? 'E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-[#15151A]">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-semibold text-[#15151A]">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
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
