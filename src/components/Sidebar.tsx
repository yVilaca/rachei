import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { activityService } from '../services/activity.service'
import { getInitials } from '../lib/utils'
import Logo from './Logo'

const CORAL = '#FF5436'

function NavItem({ active, onClick, icon, label, badge }: {
  active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-semibold transition-colors"
      style={{
        background: active ? '#FFF0ED' : 'transparent',
        color: active ? CORAL : '#5B5B66',
      }}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF5436] px-1.5 text-[11px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    activityService.getUnreadCount().then((n) => { if (!cancelled) setUnread(n) }).catch(() => {})
    return () => { cancelled = true }
  }, [pathname, currentUser])

  const isGroups = pathname === '/grupos' || pathname.startsWith('/grupos/')

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[#ECECF0] bg-white px-4 py-7 lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <div className="px-2.5">
        <Logo tone="ink" className="h-7 w-auto" />
      </div>

      <nav className="mt-9 flex flex-col gap-1">
        <NavItem active={pathname === '/dashboard'} onClick={() => navigate('/dashboard')} label="Início"
          icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
        <NavItem active={isGroups} onClick={() => navigate('/grupos')} label="Grupos"
          icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 6.2A3 3 0 0118 12M17 14.2c2.4.4 4 2.3 4 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>} />
        <NavItem active={pathname === '/atividade'} onClick={() => navigate('/atividade')} label="Atividade" badge={unread}
          icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.3 21a1.94 1.94 0 003.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>} />
        <NavItem active={pathname === '/perfil'} onClick={() => navigate('/perfil')} label="Perfil"
          icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 20c0-3.5 3.6-5.5 8-5.5s8 2 8 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>} />
      </nav>

      <button
        onClick={() => navigate('/grupos')}
        className="mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-extrabold text-white"
        style={{ background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', boxShadow: '0 8px 18px rgba(255,84,54,.28)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
        Nova dívida
      </button>

      <div className="mt-auto">
        <button onClick={() => navigate('/perfil')} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-[#F5F5F8]">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#FFB199,#FF7A59)' }}>
            {currentUser ? getInitials(currentUser.name) : ''}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#17181F]">{currentUser?.name}</span>
            <span className="block text-xs text-[#9A9AA4]">Ver perfil</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
