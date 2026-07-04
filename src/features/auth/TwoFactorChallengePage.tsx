import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { twoFactorService } from '../../services/twoFactor.service'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const INPUT_CLS = [
  'h-12 rounded-2xl border border-[#E4E4EC]',
  'bg-white px-4 text-sm text-[#15151A]',
  'placeholder:text-[#ABABBE] shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
  'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
  'transition-shadow',
].join(' ')

const LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-muted'

export default function TwoFactorChallengePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { pendingToken } = useAuthStore()

  const [code, setCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!pendingToken) {
    navigate('/login', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) { setError('Digite o código'); return }
    if (!useBackup && trimmed.replace(/\D/g, '').length !== 6) {
      setError('O código TOTP tem 6 dígitos')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await twoFactorService.challenge(pendingToken, trimmed, trustDevice)
      const redirect = searchParams.get('redirect') ?? '/dashboard'
      navigate(redirect, { replace: true })
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { detail?: string; code?: string[] } } })?.response?.data
      setError(res?.code?.[0] ?? res?.detail ?? 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (v: string) => {
    const upper = v.toUpperCase()
    const hasLetter = /[A-Z]/.test(upper)
    const cleaned = upper.replace(/[^A-Z0-9]/g, '')

    if (hasLetter || useBackup) {
      // Auto-detectou backup code (ou modo já estava em backup): formata XXXX-XXXX
      const limited = cleaned.slice(0, 8)
      const formatted = limited.length > 4 ? `${limited.slice(0, 4)}-${limited.slice(4)}` : limited
      setUseBackup(true)
      setCode(formatted)
    } else {
      // TOTP: somente dígitos, max 6
      setCode(cleaned.replace(/\D/g, '').slice(0, 6))
    }
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
          onClick={() => navigate('/login')}
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
            background: 'linear-gradient(135deg, #FF5436, #FF9A3D)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 16px 40px rgba(255,84,54,0.35)',
          }}
        >
          🔐
        </div>

        <h1 className="mt-6 font-heading text-[2rem] font-extrabold leading-tight tracking-tight text-[#15151A]">
          Dois fatores
        </h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
          {useBackup
            ? 'Digite um código de backup (formato XXXX-XXXX).'
            : 'Abra seu aplicativo autenticador e insira o código de 6 dígitos, ou comece a digitar um código de backup.'}
        </p>
      </div>

      {/* Form */}
      <div className="mt-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totp-code" className={LABEL_CLS}>
              {useBackup ? 'Código de backup' : 'Código do autenticador'}
            </Label>
            <Input
              id="totp-code"
              type="text"
              inputMode={useBackup ? 'text' : 'numeric'}
              placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
              maxLength={useBackup ? 9 : 6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={`${INPUT_CLS} text-center font-bold ${useBackup ? 'text-base tracking-widest' : 'text-xl tracking-[0.5em]'}`}
              disabled={isLoading}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {/* Trust device */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <div
              onClick={() => setTrustDevice((v) => !v)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                flexShrink: 0,
                border: `2px solid ${trustDevice ? '#FF5436' : '#D0D0DA'}`,
                background: trustDevice ? '#FF5436' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .15s',
              }}
            >
              {trustDevice && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13.5, color: '#3A3A45', fontWeight: 500 }}>
              Confiar neste dispositivo por 30 dias
            </span>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-1 h-12 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light font-extrabold text-white shadow-float"
          >
            {isLoading ? 'Verificando…' : 'Verificar'}
          </Button>

          <button
            type="button"
            onClick={() => { setUseBackup((v) => !v); setCode(''); setError('') }}
            className="text-center text-sm text-muted"
          >
            {useBackup
              ? 'Voltar para o aplicativo autenticador'
              : <>Sem acesso ao app? <span className="font-bold text-brand">Usar código de backup</span></>}
          </button>
        </form>
      </div>
    </div>
  )
}
