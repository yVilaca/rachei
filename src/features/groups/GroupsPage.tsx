import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { formatCurrency } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'

const EMOJI_BG: Record<string, string> = {
  '🏖️': '#FFF0ED',
  '🏠': '#EDF4FF',
  '🍕': '#FFF8EC',
  '🎮': '#F0EDFF',
  '✈️': '#EDF4FF',
}

export default function GroupsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { groups, debts } = useAppStore()
  const { message: toastMsg, show: showToast } = useToast()

  const groupBalances = useMemo(() => {
    if (!currentUser) return {} as Record<string, number>
    const map: Record<string, number> = {}
    for (const group of groups) {
      let net = 0
      const groupDebts = debts.filter((d) => d.groupId === group.id)
      for (const debt of groupDebts) {
        for (const inst of debt.installments) {
          if (inst.status === 'paid') continue
          if (debt.paidByUserId === currentUser.id && inst.debtorUserId !== currentUser.id) net += inst.amountCents
          if (inst.debtorUserId === currentUser.id && debt.paidByUserId !== currentUser.id) net -= inst.amountCents
        }
      }
      map[group.id] = net
    }
    return map
  }, [currentUser, groups, debts])

  if (!currentUser) return null

  const isFree = currentUser.plan === 'free'

  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto"
      style={{ background: '#F5F5F8', padding: '52px 20px 110px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* Title */}
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-0.02em', marginBottom: 4 }}>
        Grupos
      </div>
      <div style={{ fontSize: 13.5, color: '#6B6B76', marginBottom: 20 }}>
        {groups.length} grupo{groups.length !== 1 ? 's' : ''} ativo{groups.length !== 1 ? 's' : ''}
      </div>

      {/* Group cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((group) => {
          const balance = groupBalances[group.id] ?? 0
          const balanceColor = balance >= 0 ? '#11A36B' : '#FF5436'
          const balanceText = balance === 0 ? 'R$ 0,00' : formatCurrency(Math.abs(balance))
          const membersSub = `${group.members.length} membros`
          const iconBg = group.emoji ? (EMOJI_BG[group.emoji] ?? '#FFF0ED') : '#F0F0F4'

          return (
            <button
              key={group.id}
              onClick={() => navigate(`/grupos/${group.id}`)}
              style={{
                background: '#fff', borderRadius: 20, padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,.04)',
                cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                {/* Emoji icon */}
                <div style={{
                  width: 50, height: 50, borderRadius: 15, background: iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>
                  {group.emoji ?? '👥'}
                </div>
                {/* Name + sub */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1F' }}>{group.name}</div>
                  <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 2 }}>{membersSub}</div>
                </div>
                {/* Balance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10.5, color: '#6B6B76', fontWeight: 600 }}>seu saldo</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: balanceColor, whiteSpace: 'nowrap', marginTop: 2 }}>
                    {balanceText}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Toast message={toastMsg} />

      {/* Create group button */}
      <button
        onClick={() => showToast('Criação de grupos em breve!')}
        style={{
          marginTop: 16, width: '100%',
          border: '2px dashed #D8D8DF', borderRadius: 20,
          padding: 18, textAlign: 'center',
          color: '#8A8A93', fontWeight: 700, fontSize: 14.5,
          background: 'transparent', cursor: 'pointer',
        }}
      >
        + Criar novo grupo
      </button>

      {/* Free plan banner */}
      {isFree && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 14, background: '#FFF4EF',
          border: '1px solid #FFE0D2', borderRadius: 16,
          padding: '13px 15px',
        }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <div style={{ flex: 1, fontSize: 12.5, color: '#9A5A3E', lineHeight: 1.4 }}>
            <strong>Plano Free:</strong> 1 grupo próprio. Assine o Pro pra criar grupos ilimitados.
          </div>
        </div>
      )}
    </div>
  )
}
