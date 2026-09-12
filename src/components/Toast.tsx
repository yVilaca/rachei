type ToastVariant = 'success' | 'error' | 'info'

interface ToastProps {
  message: string | null
  /** Sobrescreve a inferência automática pela mensagem. */
  variant?: ToastVariant
}

// Mensagens de erro no app seguem estes padrões; o resto é confirmação (sucesso).
function inferVariant(msg: string): ToastVariant {
  return /\b(erro|não foi|nao foi|falha|falhou|inválid|invalid|expirad)/i.test(msg) ? 'error' : 'success'
}

const ACCENT: Record<ToastVariant, string> = {
  success: '#3FBE86',
  error: '#FF5A5F',
  info: '#FF8A3D',
}

function Icon({ variant, color }: { variant: ToastVariant; color: string }) {
  if (variant === 'success') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path d="M7.5 12.5l3 3 6-6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (variant === 'info') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path d="M12 11v5M12 8h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export default function Toast({ message, variant }: ToastProps) {
  const v = variant ?? (message ? inferVariant(message) : 'success')
  const color = ACCENT[v]
  return (
    <div style={{
      position: 'fixed', top: 24, left: 22, right: 22, zIndex: 200,
      pointerEvents: 'none', display: 'flex', justifyContent: 'center',
      transition: 'opacity .25s, transform .25s',
      opacity: message ? 1 : 0,
      transform: message ? 'translateY(0)' : 'translateY(-12px)',
    }}>
      <div style={{
        background: '#1A1A1F', color: '#fff', borderRadius: 14,
        padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,.22)', maxWidth: 460,
      }}>
        <Icon variant={v} color={color} />
        <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{message}</span>
      </div>
    </div>
  )
}
