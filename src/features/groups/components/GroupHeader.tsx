import { useNavigate } from 'react-router-dom'
import { getInitials, formatCurrency } from '../../../lib/utils'
import { avatarFor } from '../../../lib/avatar'
import type { GroupDetail } from '../../../types'

interface GroupHeaderProps {
  group: GroupDetail
  groupBalance: number
}

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string } | undefined> = {
  pendente_confirmacao: { label: 'Aguardando', bg: '#FFF8EC', fg: '#B07A00' },
  pendente_registro:   { label: 'Não cadastrado', bg: '#F0F0F4', fg: '#6B6B76' },
  inativo:             { label: 'Inativo', bg: '#F0F0F4', fg: '#9A9A9A' },
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
    <div style={{ padding: '52px 20px 0' }}>
      {/* Back — sempe volta para a lista de grupos (hierarquia previsível) */}
      <button
        onClick={() => navigate('/grupos')}
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
          <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 22, color: '#15151A', letterSpacing: '-0.01em' }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12.5, color: '#6B6B76' }}>
            {group.members.length} membro{group.members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Overlapping member avatars */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 4 }}>
        {group.members.map((m) => {
          const displayName = m.user?.name ?? m.contatoPendente?.name ?? '?'
          const avatarId = m.user?.id ?? String(m.id)
          const c = avatarFor(avatarId)
          const badge = STATUS_BADGE[m.status]
          const isActive = m.status === 'ativo'

          return (
            <div key={m.id} style={{ position: 'relative', marginRight: -8 }}>
              <div
                title={displayName}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: c.bg, color: c.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11,
                  border: `2.5px solid ${isActive ? '#F5F5F8' : '#E0E0E8'}`,
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {getInitials(displayName)}
              </div>
              {badge && (
                <div style={{
                  position: 'absolute', bottom: -4, right: -2,
                  background: badge.bg, borderRadius: 4,
                  fontSize: 8, fontWeight: 800, color: badge.fg,
                  padding: '1px 3px', whiteSpace: 'nowrap',
                  border: '1px solid #fff',
                }}>
                  {badge.label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Group balance card */}
      <div style={{
        marginTop: 20, background: '#fff', borderRadius: 18,
        padding: '15px 17px',
        boxShadow: '0 2px 10px rgba(0,0,0,.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#6B6B76', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Seu saldo neste grupo
          </div>
          <div style={{
            fontFamily: 'Poppins', fontWeight: 800,
            fontSize: 22, color: balanceColor, marginTop: 2,
          }}>
            {formatCurrency(Math.abs(groupBalance))}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5, color: '#6B6B76', flexShrink: 0, marginLeft: 10 }}>
          {balanceHint}
        </div>
      </div>
    </div>
  )
}
