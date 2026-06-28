import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { getInitials } from '../../lib/utils'

const PRO_FEATURES = [
  'Grupos ilimitados',
  'Cobranças automáticas via WhatsApp',
  'Lembretes e notificações',
  'Relatórios e histórico completo',
]

const TOGGLES = [
  { icon: '🔔', label: 'Cobranças recebidas' },
  { icon: '💬', label: 'Confirmações de pagamento' },
  { icon: '📅', label: 'Lembretes semanais' },
]

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 46, height: 28, borderRadius: 999, cursor: 'pointer',
        background: on ? '#FF5436' : '#D8D8E0',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
        border: 'none', padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .2s',
      }} />
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser: user, logout } = useAuthStore()
  const [toggles, setToggles] = useState([true, true, false])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const isFree = user.plan === 'free'
  const planBadgeBg = isFree ? '#F0F0F4' : 'linear-gradient(135deg,#FF5436,#FFB13D)'
  const planBadgeFg = isFree ? '#6B6B76' : '#fff'
  const planLabel = isFree ? 'FREE' : 'PRO'

  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto"
      style={{ background: '#F5F5F8', padding: '52px 20px 110px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* Title */}
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-0.02em', marginBottom: 20 }}>
        Perfil
      </div>

      {/* User card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 22, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
        <div style={{
          width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#FFB199,#FF7A59)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 20,
          border: '3px solid #fff', boxShadow: '0 3px 10px rgba(255,90,60,.3)',
        }}>
          {getInitials(user.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#15151A' }}>{user.name}</div>
          <div style={{ fontSize: 13, color: '#6B6B76', marginTop: 2 }}>{user.email}</div>
        </div>
        <span style={{
          padding: '5px 12px', borderRadius: 999,
          fontSize: 11, fontWeight: 800,
          background: planBadgeBg, color: planBadgeFg, flexShrink: 0,
        }}>
          {planLabel}
        </span>
      </div>

      {/* Pro upgrade card */}
      {isFree ? (
        <div style={{
          marginTop: 16, borderRadius: 24, padding: 22,
          background: 'linear-gradient(140deg,#2A1A12,#4A2A18)',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,154,61,.18)' }} />
          {/* Badge */}
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#FF5436,#FFB13D)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, position: 'relative' }}>
            RACHEI PRO
          </div>
          {/* Heading */}
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 21, marginTop: 14, position: 'relative' }}>
            Desbloqueie tudo
          </div>
          {/* Features */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9, position: 'relative' }}>
            {PRO_FEATURES.map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <span style={{ color: '#FFC53D', fontWeight: 800 }}>✓</span>
                <span style={{ opacity: 0.92 }}>{feat}</span>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{ marginTop: 18, background: '#fff', color: '#2A1A12', textAlign: 'center', padding: 14, borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer', position: 'relative' }}>
            Assinar Pro · R$ 9,90/mês
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16, borderRadius: 24, padding: 22, background: 'linear-gradient(140deg,#2A1A12,#4A2A18)', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>👑</div>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 20, marginTop: 8 }}>Você é Rachei Pro</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>Grupos ilimitados, WhatsApp e mais.</div>
        </div>
      )}

      {/* Notifications section */}
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 15, color: '#15151A', margin: '24px 2px 12px' }}>
        Notificações
      </div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {TOGGLES.map((t, i) => (
          <div
            key={t.label}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '15px 16px', cursor: 'pointer',
              borderBottom: i < TOGGLES.length - 1 ? '1px solid #F2F2F6' : 'none',
            }}
            onClick={() => setToggles((prev) => prev.map((v, idx) => idx === i ? !v : v))}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: '#1A1A1F' }}>{t.label}</span>
            <Toggle on={toggles[i]} onToggle={() => setToggles((prev) => prev.map((v, idx) => idx === i ? !v : v))} label={t.label} />
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        style={{ marginTop: 18, width: '100%', textAlign: 'center', color: '#E0431F', fontWeight: 700, fontSize: 14.5, padding: 14, cursor: 'pointer', background: 'none', border: 'none' }}
      >
        Sair da conta
      </button>
    </div>
  )
}
