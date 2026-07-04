import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { twoFactorService } from '../../services/twoFactor.service'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export default function TwoFactorChallengePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { pendingToken } = useAuthStore()

  const [code, setCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redireciona se não há pending token (acesso direto à rota)
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
    if (useBackup) {
      // Backup: XXXX-XXXX — aceita alfanumérico + hífen, max 9 chars
      const cleaned = v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 9)
      setCode(cleaned)
    } else {
      // TOTP: apenas dígitos, max 6
      setCode(v.replace(/\D/g, '').slice(0, 6))
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
        onClick={() => navigate('/login')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6B6B76', fontSize: 14, fontWeight: 600,
          padding: '20px 24px 0',
        }}
      >
        ← Voltar ao login
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-8 pt-8 text-center">
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#fff',
        }}>
          🔐
        </div>
        <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-[#15151A]">
          Verificação em dois fatores
        </h1>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted">
          {useBackup
            ? 'Digite um dos seus códigos de backup.'
            : 'Abra seu aplicativo autenticador e insira o código de 6 dígitos.'}
        </p>
      </div>

      {/* Card */}
      <div className="mt-auto px-6 pb-10">
        <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totp-code" className="text-sm font-semibold text-[#15151A]">
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
                className={`rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-center font-bold ${useBackup ? 'text-base tracking-widest' : 'text-xl tracking-[0.5em]'}`}
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
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${trustDevice ? '#FF5436' : '#D0D0DA'}`,
                  background: trustDevice ? '#FF5436' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
              >
                {trustDevice && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13.5, color: '#3A3A45', fontWeight: 500 }}>
                Confiar neste dispositivo por 30 dias
              </span>
            </label>

            {error && <p className="text-sm text-negative">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
            >
              {isLoading ? 'Verificando…' : 'Verificar'}
            </Button>

            <button
              type="button"
              onClick={() => { setUseBackup((v) => !v); setCode(''); setError('') }}
              className="text-center text-sm text-muted"
            >
              {useBackup
                ? 'Usar o aplicativo autenticador'
                : <>Sem acesso ao app? <span className="font-bold text-brand">Usar código de backup</span></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
