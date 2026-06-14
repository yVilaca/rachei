import { useNavigate, useLocation } from 'react-router-dom'

const CORAL = '#FF5436'
const GRAY = '#9A9AA4'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isHome = pathname === '/dashboard'
  const isGroups = pathname === '/grupos' || pathname.startsWith('/grupos/')
  const isActivity = pathname === '/atividade'
  const isProfile = pathname === '/perfil'

  // Extract group ID from /grupos/:id
  const groupIdMatch = pathname.match(/^\/grupos\/([^/]+)$/)
  const currentGroupId = groupIdMatch?.[1]

  const onFab = () => {
    if (currentGroupId) {
      navigate(`/grupos/${currentGroupId}/nova-divida`)
    } else {
      navigate('/grupos')
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#fff',
        borderTop: '1px solid #EEEEF2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '10px 18px 24px',
      }}
    >
      {/* Início */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: isHome ? CORAL : GRAY, cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Início</span>
      </button>

      {/* Grupos */}
      <button
        onClick={() => navigate('/grupos')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: isGroups ? CORAL : GRAY, cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 6.2A3 3 0 0118 12M17 14.2c2.4.4 4 2.3 4 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Grupos</span>
      </button>

      {/* FAB */}
      <button
        onClick={onFab}
        style={{
          width: 50, height: 50, borderRadius: 17,
          background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -24,
          boxShadow: '0 8px 18px rgba(255,84,54,.4)',
          cursor: 'pointer', border: 'none',
        }}
        aria-label="Nova dívida"
      >
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Atividade */}
      <button
        onClick={() => navigate('/atividade')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: isActivity ? CORAL : GRAY, cursor: 'pointer', background: 'none', border: 'none', position: 'relative' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M18 8.5a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Atividade</span>
        {!isActivity && (
          <div style={{ position: 'absolute', top: -2, right: 4, width: 8, height: 8, borderRadius: '50%', background: CORAL, border: '1.5px solid #fff' }} />
        )}
      </button>

      {/* Perfil */}
      <button
        onClick={() => navigate('/perfil')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: isProfile ? CORAL : GRAY, cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Perfil</span>
      </button>
    </div>
  )
}
