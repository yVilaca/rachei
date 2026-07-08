import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { authService } from '../../services/auth.service'

const CODE_LENGTH = 6

export default function VerifyPhonePage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const phone = currentUser?.phone ?? ''

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const code = digits.join('')

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  async function handleSubmit() {
    if (code.length < CODE_LENGTH) {
      setError('Digite o código completo de 6 dígitos')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.verifyPhone(code)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const msg = data?.code?.[0] ?? data?.detail ?? 'Código inválido ou expirado'
      setError(String(msg))
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    try {
      await authService.resendPhoneSms()
      setResendCooldown(60)
      setError('')
    } catch {
      setError('Não foi possível reenviar o código.')
    }
  }

  const maskedPhone = phone.length > 6
    ? phone.slice(0, 5) + ' ****' + phone.slice(-4)
    : phone

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F5F5F8', padding: '32px 24px',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}>
      {/* Logo */}
      <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 28, color: '#FF5436', marginBottom: 32 }}>
        rachei
      </div>

      <div style={{
        background: '#fff', borderRadius: 24, padding: '32px 24px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,.06)',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: '#FFF0ED',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 20,
        }}>
          📱
        </div>

        <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 22, color: '#15151A', marginBottom: 8 }}>
          Verifique seu telefone
        </div>
        <div style={{ fontSize: 14, color: '#6B6B76', lineHeight: 1.5, marginBottom: 28 }}>
          Enviamos um código SMS para{' '}
          <span style={{ fontWeight: 700, color: '#15151A' }}>{maskedPhone}</span>.
          Digite-o abaixo.
        </div>

        {/* OTP inputs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              style={{
                width: 48, height: 56, textAlign: 'center',
                fontSize: 22, fontWeight: 800, color: '#15151A',
                border: `2px solid ${error ? '#FF5436' : d ? '#FF5436' : '#E8E8EF'}`,
                borderRadius: 14, background: d ? '#FFF0ED' : '#F8F8FB',
                outline: 'none', caretColor: '#FF5436',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            background: '#FFF0ED', border: '1px solid #FFD8D0', borderRadius: 12,
            padding: '10px 14px', fontSize: 13, color: '#C0392B', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || code.length < CODE_LENGTH}
          style={{
            width: '100%', padding: 16, borderRadius: 16, border: 'none',
            background: code.length === CODE_LENGTH && !loading
              ? 'linear-gradient(135deg,#FF5436,#FF8A3D)'
              : '#ECECF0',
            color: code.length === CODE_LENGTH && !loading ? '#fff' : '#6B6B76',
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: code.length === CODE_LENGTH ? '0 8px 18px rgba(255,84,54,.3)' : 'none',
          }}
        >
          {loading ? 'Verificando…' : 'Confirmar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B6B76' }}>
          Não recebeu?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer',
              color: resendCooldown > 0 ? '#B0B0BA' : '#FF5436', fontSize: 14,
            }}
          >
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
          </button>
        </div>
      </div>
    </div>
  )
}
