import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { twoFactorService } from '../../../services/twoFactor.service'
import type { TrustedDevice } from '../../../services/twoFactor.service'

type Step = 'idle' | 'qr' | 'confirm' | 'backup'
type DisableStep = 'idle' | 'confirming'

function CodeInput({
  value, onChange, disabled, placeholder = '000000', maxLen = 6,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  maxLen?: number
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      maxLength={maxLen}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
      disabled={disabled}
      autoComplete="one-time-code"
      style={{
        width: '100%', textAlign: 'center', fontSize: 22, fontWeight: 800,
        letterSpacing: '0.45em', border: '1.5px solid #E4E4EE',
        borderRadius: 14, padding: '12px 8px', background: '#FAFAFC',
        color: '#15151A', outline: 'none',
      }}
    />
  )
}

function BackupGrid({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false)
  const text = codes.join('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: '#6B6B76', lineHeight: 1.5 }}>
        Guarde esses códigos em local seguro. Cada um pode ser usado{' '}
        <strong>uma única vez</strong> se você perder acesso ao autenticador.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {codes.map((c) => (
          <div
            key={c}
            style={{
              background: '#F5F5F8', borderRadius: 10, padding: '8px 12px',
              fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
              textAlign: 'center', color: '#15151A', letterSpacing: '0.05em',
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          marginTop: 4, padding: '10px 16px', borderRadius: 12,
          border: '1.5px solid #E4E4EE', background: '#fff',
          fontSize: 13.5, fontWeight: 700, color: '#15151A', cursor: 'pointer',
        }}
      >
        {copied ? 'Copiado!' : 'Copiar todos'}
      </button>
    </div>
  )
}

export default function TwoFactorSection() {
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [disableStep, setDisableStep] = useState<DisableStep>('idle')

  // Setup flow state
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [setupError, setSetupError] = useState('')
  const [isLoadingSetup, setIsLoadingSetup] = useState(false)

  // Disable flow state
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disableError, setDisableError] = useState('')
  const [isLoadingDisable, setIsLoadingDisable] = useState(false)

  // Regen backup codes
  const [regenCode, setRegenCode] = useState('')
  const [regenCodes, setRegenCodes] = useState<string[]>([])
  const [showRegen, setShowRegen] = useState(false)
  const [regenError, setRegenError] = useState('')
  const [isLoadingRegen, setIsLoadingRegen] = useState(false)

  // Trusted devices — null = ainda não carregado (deriva o estado de loading).
  const [devices, setDevices] = useState<TrustedDevice[] | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    twoFactorService.getStatus().then((r) => setIsActive(r.is_active)).catch(() => setIsActive(false))
  }, [])

  useEffect(() => {
    if (!isActive) return
    let cancelled = false
    twoFactorService.getTrustedDevices()
      .then((d) => { if (!cancelled) setDevices(d) })
      .catch(() => { if (!cancelled) setDevices([]) })
    return () => { cancelled = true }
  }, [isActive])

  const loadingDevices = isActive && devices === null

  const handleRevokeDevice = async (id: number) => {
    setRevokingId(id)
    try {
      await twoFactorService.deleteTrustedDevice(id)
      setDevices((prev) => (prev ?? []).filter((d) => d.id !== id))
    } catch {
      // falha silenciosa — o item permanece na lista
    } finally {
      setRevokingId(null)
    }
  }

  // ---- Setup ----

  const handleStartSetup = async () => {
    setSetupError('')
    setIsLoadingSetup(true)
    try {
      const { secret: s, otpauth_uri } = await twoFactorService.getSetup()
      setSecret(s)
      const dataUrl = await QRCode.toDataURL(otpauth_uri, { width: 200, margin: 2 })
      setQrDataUrl(dataUrl)
      setStep('qr')
    } catch {
      setSetupError('Não foi possível iniciar a configuração.')
    } finally {
      setIsLoadingSetup(false)
    }
  }

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmCode.length !== 6) { setSetupError('Digite os 6 dígitos'); return }
    setSetupError('')
    setIsLoadingSetup(true)
    try {
      const { backup_codes } = await twoFactorService.confirmSetup(confirmCode)
      setBackupCodes(backup_codes)
      setStep('backup')
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { code?: string[]; detail?: string } } })?.response?.data
      setSetupError(d?.code?.[0] ?? d?.detail ?? 'Código inválido.')
    } finally {
      setIsLoadingSetup(false)
    }
  }

  const handleFinishSetup = () => {
    setIsActive(true)
    setStep('idle')
    setConfirmCode('')
    setBackupCodes([])
    setQrDataUrl('')
    setSecret('')
  }

  // ---- Disable ----

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disablePassword || disableCode.length !== 6) {
      setDisableError('Preencha a senha e o código.')
      return
    }
    setDisableError('')
    setIsLoadingDisable(true)
    try {
      await twoFactorService.disable(disablePassword, disableCode)
      setIsActive(false)
      setDisableStep('idle')
      setDisablePassword('')
      setDisableCode('')
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { code?: string[]; password?: string[]; detail?: string } } })?.response?.data
      setDisableError(d?.code?.[0] ?? d?.password?.[0] ?? d?.detail ?? 'Erro ao desativar.')
    } finally {
      setIsLoadingDisable(false)
    }
  }

  // ---- Regen backup codes ----

  const handleRegen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regenCode.length !== 6) { setRegenError('Digite os 6 dígitos'); return }
    setRegenError('')
    setIsLoadingRegen(true)
    try {
      const { backup_codes } = await twoFactorService.regenerateBackupCodes(regenCode)
      setRegenCodes(backup_codes)
      setRegenCode('')
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { code?: string[]; detail?: string } } })?.response?.data
      setRegenError(d?.code?.[0] ?? d?.detail ?? 'Código inválido.')
    } finally {
      setIsLoadingRegen(false)
    }
  }

  if (isActive === null) return null

  const sectionLabel = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔐</span>
        <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F' }}>Autenticador</span>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
        background: isActive ? '#E9F9F0' : '#F0F0F4',
        color: isActive ? '#1A7A4A' : '#6B6B76',
      }}>
        {isActive ? 'ATIVO' : 'INATIVO'}
      </span>
    </div>
  )

  // ---- INACTIVE: setup flow ----
  if (!isActive) {
    if (step === 'idle') return (
      <div>
        {sectionLabel}
        <p style={{ fontSize: 12.5, color: '#6B6B76', marginBottom: 10, lineHeight: 1.5 }}>
          Adicione uma segunda camada de segurança usando Google Authenticator ou Authy.
        </p>
        {setupError && <p style={{ fontSize: 13, color: '#E0431F', marginBottom: 8 }}>{setupError}</p>}
        <button
          type="button"
          onClick={handleStartSetup}
          disabled={isLoadingSetup}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 14,
            background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
            color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
          }}
        >
          {isLoadingSetup ? 'Carregando…' : 'Ativar autenticador'}
        </button>
      </div>
    )

    if (step === 'qr') return (
      <div>
        {sectionLabel}
        <p style={{ fontSize: 12.5, color: '#6B6B76', marginBottom: 12, lineHeight: 1.5 }}>
          Escaneie o QR code com Google Authenticator ou Authy:
        </p>
        {qrDataUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <img src={qrDataUrl} alt="QR Code 2FA" style={{ width: 180, height: 180, borderRadius: 12 }} />
          </div>
        )}
        <p style={{ fontSize: 11.5, color: '#6B6B76', marginBottom: 6 }}>
          Ou insira o código manualmente:
        </p>
        <div style={{
          background: '#F5F5F8', borderRadius: 10, padding: '8px 12px',
          fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.08em', color: '#15151A', marginBottom: 14,
          wordBreak: 'break-all',
        }}>
          {secret}
        </div>
        <button
          type="button"
          onClick={() => setStep('confirm')}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 14,
            background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
            color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
          }}
        >
          Já escaneei →
        </button>
      </div>
    )

    if (step === 'confirm') return (
      <div>
        {sectionLabel}
        <p style={{ fontSize: 12.5, color: '#6B6B76', marginBottom: 12, lineHeight: 1.5 }}>
          Digite o código de 6 dígitos exibido no seu autenticador para confirmar:
        </p>
        <form onSubmit={handleConfirmSetup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CodeInput value={confirmCode} onChange={setConfirmCode} disabled={isLoadingSetup} />
          {setupError && <p style={{ fontSize: 13, color: '#E0431F' }}>{setupError}</p>}
          <button
            type="submit"
            disabled={isLoadingSetup || confirmCode.length !== 6}
            style={{
              padding: '12px 16px', borderRadius: 14,
              background: confirmCode.length === 6 ? 'linear-gradient(135deg,#FF5436,#FF9A3D)' : '#E4E4EE',
              color: confirmCode.length === 6 ? '#fff' : '#9A9AAA',
              fontWeight: 800, fontSize: 14, border: 'none', cursor: confirmCode.length === 6 ? 'pointer' : 'default',
            }}
          >
            {isLoadingSetup ? 'Verificando…' : 'Confirmar'}
          </button>
          <button type="button" onClick={() => setStep('qr')} style={{ fontSize: 13, color: '#6B6B76', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Voltar ao QR
          </button>
        </form>
      </div>
    )

    if (step === 'backup') return (
      <div>
        {sectionLabel}
        <BackupGrid codes={backupCodes} />
        <button
          type="button"
          onClick={handleFinishSetup}
          style={{
            marginTop: 12, width: '100%', padding: '12px 16px', borderRadius: 14,
            background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
            color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
          }}
        >
          Copiei e guardei os códigos
        </button>
      </div>
    )
  }

  // ---- ACTIVE ----
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sectionLabel}

      {/* Disable flow */}
      {disableStep === 'idle' ? (
        <button
          type="button"
          onClick={() => setDisableStep('confirming')}
          style={{
            padding: '10px 16px', borderRadius: 12,
            border: '1.5px solid #FFCFCF', background: '#FFF5F5',
            color: '#E0431F', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
          }}
        >
          Desativar autenticador
        </button>
      ) : (
        <form onSubmit={handleDisable} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12.5, color: '#6B6B76' }}>
            Confirme sua senha e o código atual do autenticador:
          </p>
          <input
            type="password"
            placeholder="Sua senha atual"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            disabled={isLoadingDisable}
            style={{
              border: '1.5px solid #E4E4EE', borderRadius: 12, padding: '11px 14px',
              fontSize: 14, background: '#FAFAFC', outline: 'none', color: '#15151A',
            }}
          />
          <CodeInput value={disableCode} onChange={setDisableCode} disabled={isLoadingDisable} />
          {disableError && <p style={{ fontSize: 13, color: '#E0431F' }}>{disableError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setDisableStep('idle'); setDisablePassword(''); setDisableCode(''); setDisableError('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #E4E4EE',
                background: '#fff', color: '#6B6B76', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoadingDisable}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                background: '#E0431F', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}
            >
              {isLoadingDisable ? 'Desativando…' : 'Desativar'}
            </button>
          </div>
        </form>
      )}

      {/* Regen backup codes */}
      {!showRegen ? (
        <button
          type="button"
          onClick={() => setShowRegen(true)}
          style={{
            padding: '10px 16px', borderRadius: 12, border: '1.5px solid #E4E4EE',
            background: '#fff', color: '#6B6B76', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
          }}
        >
          Regerar códigos de backup
        </button>
      ) : regenCodes.length > 0 ? (
        <div>
          <BackupGrid codes={regenCodes} />
          <button
            type="button"
            onClick={() => { setShowRegen(false); setRegenCodes([]) }}
            style={{
              marginTop: 10, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #E4E4EE',
              background: '#fff', color: '#6B6B76', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              width: '100%',
            }}
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleRegen} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12.5, color: '#6B6B76' }}>
            Digite o código do autenticador para gerar novos códigos de backup:
          </p>
          <CodeInput value={regenCode} onChange={setRegenCode} disabled={isLoadingRegen} />
          {regenError && <p style={{ fontSize: 13, color: '#E0431F' }}>{regenError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setShowRegen(false); setRegenCode(''); setRegenError('') }}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #E4E4EE',
                background: '#fff', color: '#6B6B76', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoadingRegen || regenCode.length !== 6}
              style={{
                flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
                color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              }}
            >
              {isLoadingRegen ? 'Gerando…' : 'Gerar'}
            </button>
          </div>
        </form>
      )}

      {/* Dispositivos confiáveis */}
      {(loadingDevices || (devices?.length ?? 0) > 0) && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#6B6B76', letterSpacing: '0.06em',
            marginBottom: 8,
          }}>
            DISPOSITIVOS CONFIÁVEIS
          </div>
          {loadingDevices ? (
            <p style={{ fontSize: 12.5, color: '#6B6B76' }}>Carregando…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(devices ?? []).map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12,
                    background: '#F5F5F8', border: '1px solid #E4E4EE',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#1A1A1F',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {d.user_agent || 'Dispositivo desconhecido'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B6B76', marginTop: 1 }}>
                      Adicionado {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      {d.last_used_at && (
                        <> · Usado {new Date(d.last_used_at).toLocaleDateString('pt-BR')}</>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(d.id)}
                    disabled={revokingId === d.id}
                    style={{
                      padding: '5px 11px', borderRadius: 8,
                      border: '1px solid #FFCFCF', background: '#FFF5F5',
                      color: '#E0431F', fontSize: 12, fontWeight: 700,
                      cursor: revokingId === d.id ? 'default' : 'pointer',
                      flexShrink: 0, opacity: revokingId === d.id ? 0.5 : 1,
                    }}
                  >
                    {revokingId === d.id ? '…' : 'Revogar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
