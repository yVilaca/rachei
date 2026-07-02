import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

type Step = 'request' | 'reset' | 'done'

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
      // Neutral — always advance to the code step so we don't reveal if email exists
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

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: 'linear-gradient(170deg,#FFF1EC 0%,#F5F5F8 46%)' }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => step === 'reset' ? setStep('request') : navigate('/login')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6B6B76', fontSize: 14, fontWeight: 600,
          padding: '20px 24px 0',
        }}
      >
        ← {step === 'reset' ? 'Reenviar código' : 'Voltar ao login'}
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-8 pt-8 text-center">
        <div
          style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: '#fff',
          }}
        >
          {step === 'done' ? '✓' : '🔑'}
        </div>
        <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-[#15151A]">
          {step === 'request' && 'Esqueci minha senha'}
          {step === 'reset' && 'Digite o código'}
          {step === 'done' && 'Senha redefinida!'}
        </h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
          {step === 'request' && 'Informe seu e-mail e enviaremos um código de 6 dígitos.'}
          {step === 'reset' && `Verifique seu e-mail e insira o código abaixo. Ele expira em 20 minutos.`}
          {step === 'done' && 'Você foi desconectado de todos os dispositivos. Faça login com a nova senha.'}
        </p>
      </div>

      {/* Card */}
      <div className="mt-auto px-6 pb-10">
        <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {step === 'request' && (
            <form onSubmit={handleRequest} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fp-email" className="text-sm font-semibold text-[#15151A]">
                  E-mail
                </Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-negative">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
              >
                {isLoading ? 'Enviando…' : 'Enviar código'}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fp-code" className="text-sm font-semibold text-[#15151A]">
                  Código de 6 dígitos
                </Label>
                <Input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em]"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fp-password" className="text-sm font-semibold text-[#15151A]">
                  Nova senha
                </Label>
                <Input
                  id="fp-password"
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
            <div className="flex flex-col gap-3">
              <div
                style={{
                  background: '#E9F9F0', borderRadius: 14, padding: '14px 16px',
                  color: '#1A7A4A', fontSize: 14, fontWeight: 600, textAlign: 'center',
                }}
              >
                Senha alterada com sucesso ✓
              </div>
              <Button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
              >
                Ir para o login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
