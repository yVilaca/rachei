interface ToastProps {
  message: string | null
}

export default function Toast({ message }: ToastProps) {
  return (
    <div style={{
      position: 'fixed', top: 24, left: 22, right: 22, zIndex: 200,
      pointerEvents: 'none',
      transition: 'opacity .25s, transform .25s',
      opacity: message ? 1 : 0,
      transform: message ? 'translateY(0)' : 'translateY(-12px)',
    }}>
      <div style={{
        background: '#1A1A1F', color: '#fff', borderRadius: 14,
        padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,.22)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" stroke="#FF5436" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="#FF5436" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{message}</span>
      </div>
    </div>
  )
}
