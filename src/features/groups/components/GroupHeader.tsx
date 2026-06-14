import { useNavigate } from 'react-router-dom'
import { getInitials, formatCurrency } from '../../../lib/utils'
import type { Group } from '../../../types'

const AVATAR_COLORS = [
  { bg: '#FFE0D2', fg: '#E0431F' },
  { bg: '#D2E8FF', fg: '#1A6FC4' },
  { bg: '#D2F5E5', fg: '#0E8F5C' },
  { bg: '#F5D2FF', fg: '#8B1AC4' },
  { bg: '#FFF3D2', fg: '#C47A1A' },
]

interface GroupHeaderProps {
  group: Group
  groupBalance: number
}

export default function GroupHeader({ group, groupBalance }: GroupHeaderProps) {
  const navigate = useNavigate()

  const balanceColor = groupBalance >= 0 ? '#11A36B' : '#FF5436'
  const balanceHint = groupBalance > 0
    ? 'te devem neste grupo'
    : groupBalance < 0
    ? 'você deve neste grupo'
    : 'saldo zerado'

  return (
    <div style={{ padding: '14px 20px 0' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#6B6B76', fontWeight: 700, fontSize: 14,
          background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14,
        }}
      >
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
          <path d="M7.5 1L1.5 7.5l6 6.5" stroke="#6B6B76" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Voltar
      </button>

      {/* Group icon + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16, flexShrink: 0,
          background: '#FFF0ED', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 26,
        }}>
          {group.emoji ?? '👥'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 22, color: '#15151A', letterSpacing: '-0.01em' }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12.5, color: '#9A9AA4' }}>
            {group.members.length} membros
          </div>
        </div>
      </div>

      {/* Overlapping member avatars */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
        {group.members.map((m, i) => {
          const c = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <div
              key={m.userId}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: c.bg, color: c.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 11,
                border: '2.5px solid #F5F5F8',
                marginRight: -8,
              }}
            >
              {getInitials(m.user.name)}
            </div>
          )
        })}
      </div>

      {/* Group balance card */}
      <div style={{
        marginTop: 16, background: '#fff', borderRadius: 18,
        padding: '15px 17px',
        boxShadow: '0 2px 10px rgba(0,0,0,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#9A9AA4', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Seu saldo neste grupo
          </div>
          <div style={{
            fontFamily: '"Bricolage Grotesque"', fontWeight: 800,
            fontSize: 22, color: balanceColor, marginTop: 2,
          }}>
            {formatCurrency(Math.abs(groupBalance))}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5, color: '#9A9AA4', flexShrink: 0, marginLeft: 10 }}>
          {balanceHint}
        </div>
      </div>
    </div>
  )
}
