import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
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
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Preencha todos os campos')
      return
    }
    if (password.length < 6) {
      setError('Senha deve ter ao menos 6 caracteres')
      return
    }
    register(name, email, password)
    navigate('/dashboard', { replace: true })
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
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password" className="text-sm font-semibold text-[#15151A]">Senha</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
        />
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
      <Button
        type="submit"
        className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
      >
        Criar conta
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
