import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone || !password) {
      setError('Preencha todos os campos')
      return
    }
    if (!/^\+\d{8,15}$/.test(phone)) {
      setError('Telefone no formato E.164, ex: +5531999999999')
      return
    }
    if (password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await authService.register(name, email, phone, password)
      navigate('/verificar-telefone', { replace: true })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const msg =
        data?.phone?.[0] ??
        data?.email?.[0] ??
        data?.password?.[0] ??
        data?.name?.[0] ??
        'Erro ao criar conta'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted">
          Nome completo
        </Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLS}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-widest text-muted">
          E-mail
        </Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLS}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-phone" className="text-xs font-semibold uppercase tracking-widest text-muted">
          Telefone (WhatsApp)
        </Label>
        <Input
          id="reg-phone"
          type="tel"
          placeholder="+5531999999999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT_CLS}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-widest text-muted">
          Senha
        </Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mínimo 8 caracteres"
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
