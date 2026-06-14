import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../stores/app.store'

const CORAL = '#FF5436'
const GRAY = '#9A9AA4'

const EMOJI_BG: Record<string, string> = {
  '🏖️': '#FFF0ED',
  '🏠': '#EDF4FF',
}

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { groups } = useAppStore()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isHome = pathname === '/dashboard'
  const isGroups = pathname === '/grupos' || pathname.startsWith('/grupos/')
  const isActivity = pathname === '/atividade'
  const isProfile = pathname === '/perfil'

  const groupIdMatch = pathname.match(/^\/grupos\/([^/]+)$/)
  const currentGroupId = groupIdMatch?.[1]

  const onFab = () => {
    if (currentGroupId) {
      navigate(`/grupos/${currentGroupId}/nova-divida`)
    } else {
      setSheetOpen(true)
    }
  }

  const pickGroup = (groupId: string) => {
    setSheetOpen(false)
    navigate(`/grupos/${groupId}/nova-divida`)
  }

  return (
    <>
      {/* Group picker bottom sheet */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,10,15,.45)',
            zIndex: 60,
            display: 'flex', alignItems: 'flex-end',
            animation: 'rchFade .2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', background: '#fff',
              borderRadius: '28px 28px 0 0',
              padding: '10px 24px 40px',
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 5, borderRadius: 999, background: '#E2E2E8', margin: '0 auto 20px' }} />

            <p style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 18, color: '#15151A', marginBottom: 4 }}>
              Nova dívida
            </p>
            <p style={{ fontSize: 13, color: '#9A9AA4', marginBottom: 20 }}>
              Selecione o grupo
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => pickGroup(group.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13,
                    background: '#FAFAFC', borderRadius: 16, padding: '13px 15px',
                    border: '1.5px solid #ECECF0', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                    background: group.emoji ? (EMOJI_BG[group.emoji] ?? '#FFF0ED') : '#F0F0F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {group.emoji ?? '👥'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>{group.name}</div>
                    <div style={{ fontSize: 12, color: '#9A9AA4', marginTop: 2 }}>{group.members.length} membros</div>
                  </div>
                  <svg style={{ marginLeft: 'auto' }} width="8" height="14" viewBox="0 0 8 14" fill="none">
                    <path d="M1 1l6 6-6 6" stroke="#C0C0C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
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
    </>
  )
}
