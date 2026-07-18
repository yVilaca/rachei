import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { getInitials } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import { authService } from '../../services/auth.service'
import TwoFactorSection from './components/TwoFactorSection'

const PRO_FEATURES = [
  'Grupos ilimitados',
  'Cobranças automáticas via WhatsApp',
  'Lembretes e notificações',
  'Relatórios e histórico completo',
]

type PrefKey = 'notifCobrancas' | 'notifConfirmacoes' | 'notifLembretes'
const TOGGLES: { key: PrefKey; icon: string; label: string }[] = [
  { key: 'notifCobrancas', icon: '🔔', label: 'Cobranças recebidas' },
  { key: 'notifConfirmacoes', icon: '💬', label: 'Confirmações de pagamento' },
  { key: 'notifLembretes', icon: '📅', label: 'Lembretes semanais' },
]

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}
      style={{
        width: 46, height: 28, borderRadius: 999, cursor: 'pointer',
        background: on ? '#FF5436' : '#D8D8E0',
        position: 'relative', transition: 'background .2s', flexShrink: 0, border: 'none', padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s',
      }} />
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.currentUser)
  const { message: toastMsg, show: showToast } = useToast()

  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login', { replace: true })
  }

  const openEdit = () => {
    setNameDraft(user?.name ?? '')
    setEditing(true)
  }

  const saveName = async () => {
    const name = nameDraft.trim()
    if (!name || savingName) return
    setSavingName(true)
    try {
      await authService.updateProfile({ name })
      setEditing(false)
      showToast('Perfil atualizado!')
    } catch {
      showToast('Não foi possível salvar o nome.')
    } finally {
      setSavingName(false)
    }
  }

  const togglePref = async (key: PrefKey, next: boolean) => {
    if (!user) return
    // Otimista: atualiza na hora; reverte se falhar.
    useAuthStore.getState().setUser({ ...user, [key]: next })
    try {
      await authService.updateProfile({ [key]: next })
    } catch {
      useAuthStore.getState().setUser({ ...user, [key]: !next })
      showToast('Não foi possível salvar a preferência.')
    }
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: planBadgeBg, color: planBadgeFg }}>
            {planLabel}
          </span>
          <button
            onClick={openEdit}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#FF5436', fontWeight: 700, fontSize: 12.5, padding: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" stroke="#FF5436" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            Editar
          </button>
        </div>
      </div>

      {/* Pro upgrade card */}
      {isFree ? (
        <div style={{ marginTop: 16, borderRadius: 24, padding: 22, background: 'linear-gradient(140deg,#2A1A12,#4A2A18)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,154,61,.18)' }} />
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#FF5436,#FFB13D)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999, position: 'relative' }}>
            RACHEI PRO
          </div>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 21, marginTop: 14, position: 'relative' }}>
            Desbloqueie tudo
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9, position: 'relative' }}>
            {PRO_FEATURES.map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <span style={{ color: '#FFC53D', fontWeight: 800 }}>✓</span>
                <span style={{ opacity: 0.92 }}>{feat}</span>
              </div>
            ))}
          </div>
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

      {/* Security */}
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 15, color: '#15151A', margin: '24px 2px 12px' }}>
        Segurança
      </div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,.04)', padding: '16px 16px' }}>
        <TwoFactorSection />
      </div>

      {/* Notifications */}
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 15, color: '#15151A', margin: '24px 2px 12px' }}>
        Notificações
      </div>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 2px 10px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        {TOGGLES.map((t, i) => {
          const on = user[t.key]
          return (
            <div
              key={t.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer',
                borderBottom: i < TOGGLES.length - 1 ? '1px solid #F2F2F6' : 'none',
              }}
              onClick={() => togglePref(t.key, !on)}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: '#1A1A1F' }}>{t.label}</span>
              <Toggle on={on} onToggle={() => togglePref(t.key, !on)} label={t.label} />
            </div>
          )
        })}
      </div>

      <button
        type="button" onClick={handleLogout}
        style={{ marginTop: 18, width: '100%', textAlign: 'center', color: '#E0431F', fontWeight: 700, fontSize: 14.5, padding: 14, cursor: 'pointer', background: 'none', border: 'none' }}
      >
        Sair da conta
      </button>

      <Toast message={toastMsg} />

      {/* Edit name sheet */}
      {editing && (
        <div
          onClick={() => { if (!savingName) setEditing(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }}
          >
            <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 20, color: '#15151A', marginBottom: 16 }}>
              Editar perfil
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B6B76', marginBottom: 8 }}>NOME</div>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={150}
              autoFocus
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: '2px solid #E8E8EF', fontSize: 15, color: '#1A1A1F', outline: 'none',
                fontFamily: '"Plus Jakarta Sans", sans-serif', boxSizing: 'border-box', marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 12, color: '#9A9AA4', marginBottom: 20 }}>
              O e-mail não pode ser alterado por aqui.
            </div>
            <button
              onClick={saveName}
              disabled={savingName || !nameDraft.trim()}
              style={{
                width: '100%', padding: 15, borderRadius: 16, border: 'none',
                cursor: savingName || !nameDraft.trim() ? 'not-allowed' : 'pointer',
                background: savingName || !nameDraft.trim() ? '#EBEBEF' : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
                color: savingName || !nameDraft.trim() ? '#9A9AA4' : '#fff', fontWeight: 800, fontSize: 15.5,
              }}
            >
              {savingName ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
