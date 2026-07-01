import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../../services/auth.service'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Preencha todos os campos')
      return
    }
    if (password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await authService.register(name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const msg = data?.email?.[0] ?? data?.password?.[0] ?? data?.name?.[0] ?? 'Erro ao criar conta'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-sm font-semibold text-[#15151A]">Nome</Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email" className="text-sm font-semibold text-[#15151A]">E-mail</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password" className="text-sm font-semibold text-[#15151A]">Senha</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mínimo 8 caracteres"
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
        {isLoading ? 'Criando conta…' : 'Criar conta'}
      </Button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-bold text-brand">
          Entrar
        </button>
      </p>
    </form>
  )
}
