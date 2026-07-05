import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

type Step = 'request' | 'reset' | 'done'

const INPUT_CLS = [
  'h-12 rounded-2xl border border-[#E4E4EC]',
  'bg-white px-4 text-sm text-[#15151A]',
  'placeholder:text-[#ABABBE] shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
  'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
  'transition-shadow',
].join(' ')

const LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-muted'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Informe seu e-mail'); return }
    setError('')
    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setStep('reset')
    } catch {
      setStep('reset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.length !== 6) { setError('Digite o código de 6 dígitos'); return }
    if (!password) { setError('Digite a nova senha'); return }
    if (password.length < 8) { setError('Senha deve ter ao menos 8 caracteres'); return }
    setError('')
    setIsLoading(true)
    try {
      await authService.resetPassword(email, code, password)
      setStep('done')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const msg = data?.code?.[0] ?? data?.password?.[0] ?? data?.detail ?? 'Erro ao redefinir senha'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const stepTitle: Record<Step, string> = {
    request: 'Esqueceu a senha?',
    reset: 'Digite o código',
    done: 'Senha redefinida!',
  }
  const stepSubtitle: Record<Step, string> = {
    request: 'Informe seu e-mail e enviaremos um código de 6 dígitos.',
    reset: 'Verifique seu e-mail e insira o código abaixo. Ele expira em 20 minutos.',
    done: 'Você foi desconectado de todos os dispositivos. Faça login com a nova senha.',
  }

  return (
    <div
      className="flex min-h-dvh flex-col px-6 pb-12"
      style={{ background: 'linear-gradient(170deg,#FFF1EC 0%,#F5F5F8 60%)' }}
    >
      {/* Back button */}
      <div className="pt-5">
        <button
          type="button"
          onClick={() => (step === 'reset' ? setStep('request') : navigate('/login'))}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#fff',
            border: '1.5px solid #ECECF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#15151A',
            fontSize: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          ←
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center pt-10 text-center">
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: step === 'done'
              ? 'linear-gradient(135deg, #11A36B, #1DC980)'
              : 'linear-gradient(135deg, #FF5436, #FF9A3D)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: step === 'done'
              ? '0 16px 40px rgba(17,163,107,0.35)'
              : '0 16px 40px rgba(255,84,54,0.35)',
          }}
        >
          {step === 'done' ? '✓' : '🔑'}
        </div>

        <h1 className="mt-6 font-heading text-[2rem] font-extrabold leading-tight tracking-tight text-[#15151A]">
          {stepTitle[step]}
        </h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
          {stepSubtitle[step]}
        </p>
      </div>

      {/* Form */}
      <div className="mt-10">
        {step === 'request' && (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fp-email" className={LABEL_CLS}>E-mail</Label>
              <Input
                id="fp-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLS}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light font-extrabold text-white shadow-float"
            >
              {isLoading ? 'Enviando…' : 'Enviar código'}
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fp-code" className={LABEL_CLS}>Código de 6 dígitos</Label>
              <Input
                id="fp-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${INPUT_CLS} text-center text-xl font-bold tracking-[0.5em]`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fp-password" className={LABEL_CLS}>Nova senha</Label>
              <Input
                id="fp-password"
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
              {isLoading ? 'Redefinindo…' : 'Redefinir senha'}
            </Button>
            <button
              type="button"
              onClick={handleRequest}
              disabled={isLoading}
              className="text-center text-sm text-muted"
            >
              Não recebeu?{' '}
              <span className="font-bold text-brand">Reenviar código</span>
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-[#E9F9F0] px-4 py-3.5 text-center text-sm font-semibold text-[#1A7A4A]">
              Senha alterada com sucesso ✓
            </div>
            <Button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light font-extrabold text-white shadow-float"
            >
              Ir para o login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
