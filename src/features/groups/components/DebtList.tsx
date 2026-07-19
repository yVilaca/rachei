import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { formatCurrency, formatDate } from '../../../lib/utils'
import type { Debt } from '../../../types'

interface DebtListProps {
  debts: Debt[]
}

type Filter = 'all' | 'pending' | 'paid'

/** Status da dívida do ponto de vista do usuário atual. */
function statusParaUsuario(debt: Debt, userId?: string) {
  const pendingCount = debt.installments.filter((i) => i.status !== 'paid').length
  if (pendingCount === 0) {
    return { label: 'Quitada', bg: '#E9F9F0', fg: '#0E8F5C' }
  }
  // Credor: as pendências são valores a receber, não uma dívida sua.
  if (debt.paidBy.id === userId) {
    return { label: 'A receber', bg: '#E9F9F0', fg: '#0E8F5C' }
  }
  const minhas = debt.installments.filter((i) => i.debtor.id === userId)
  if (minhas.some((i) => i.status === 'pending')) {
    return { label: 'Você deve', bg: '#FFF0ED', fg: '#E0431F' }
  }
  if (minhas.some((i) => i.status === 'awaiting_confirmation')) {
    return { label: 'Em análise', bg: '#F0F0F4', fg: '#6B6B76' }
  }
  // Sua parte já quitada, mas ainda há pendências de outros.
  return { label: 'Sua parte quitada', bg: '#E9F9F0', fg: '#0E8F5C' }
}

const DEBT_ICON_COLORS = ['#FFF0ED', '#EDF4FF', '#EDFFF6', '#F5EEFF', '#FFFBEC']

function getDebtEmoji(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('restaur') || d.includes('jantar') || d.includes('almoç') || d.includes('rodízio') || d.includes('pizza') || d.includes('sushi') || d.includes('japon') || d.includes('comida')) return '🍽️'
  if (d.includes('uber') || d.includes('corrida') || d.includes('táxi') || d.includes('99') || d.includes('gasolina') || d.includes('combustível')) return '🚗'
  if (d.includes('mercado') || d.includes('supermercado') || d.includes('feira')) return '🛒'
  if (d.includes('cinema') || d.includes('ingresso') || d.includes('show') || d.includes('evento')) return '🎬'
  if (d.includes('hotel') || d.includes('hostel') || d.includes('airbnb') || d.includes('hospedagem')) return '🏨'
  if (d.includes('bar') || d.includes('cerveja') || d.includes('drink') || d.includes('boteco')) return '🍺'
  if (d.includes('aluguel') || d.includes('condom') || d.includes('conta') || d.includes('luz') || d.includes('água')) return '🏠'
  if (d.includes('praia') || d.includes('viagem') || d.includes('passeio') || d.includes('trilha')) return '🏖️'
  return '💸'
}

export default function DebtList({ debts }: DebtListProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.currentUser?.id)

  const filtered = debts.filter((debt) => {
    if (filter === 'all') return true
    const hasAnyPending = debt.installments.some((i) => i.status !== 'paid')
    return filter === 'pending' ? hasAnyPending : !hasAnyPending
  })

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'paid', label: 'Pagas' },
  ]

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '18px 20px 12px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 15px', borderRadius: 999,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
              background: filter === tab.key ? '#FF5436' : '#fff',
              color: filter === tab.key ? '#fff' : '#3A3A42',
              boxShadow: filter === tab.key ? 'none' : '0 1px 4px rgba(0,0,0,.06)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Debt cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B6B76', padding: '24px 0' }}>
            Nenhuma dívida encontrada
          </p>
        )}
        {filtered.map((debt, idx) => {
          const pendingCount = debt.installments.filter((i) => i.status !== 'paid').length
          const totalCount = debt.installments.length
          const payerName = debt.paidBy.name.split(' ')[0]
          const iconBg = DEBT_ICON_COLORS[idx % DEBT_ICON_COLORS.length]
          const { label: statusLabel, bg: statusBg, fg: statusFg } = statusParaUsuario(debt, currentUserId)
          const progress = `${totalCount - pendingCount} de ${totalCount} quitado${totalCount - pendingCount !== 1 ? 's' : ''}`

          return (
            <button
              key={debt.id}
              onClick={() => navigate(`/dividas/${debt.id}`)}
              style={{
                background: '#fff', borderRadius: 18, padding: 15,
                boxShadow: '0 2px 10px rgba(0,0,0,.04)',
                cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13, background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {getDebtEmoji(debt.description)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {debt.description}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 2 }}>
                      Pago por {payerName} · {formatDate(debt.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#15151A', flexShrink: 0, paddingTop: 2 }}>
                  {formatCurrency(debt.totalAmountCents)}
                </div>
              </div>

              {/* Bottom row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: '#6B6B76' }}>{progress}</span>
                <span style={{
                  padding: '4px 11px', borderRadius: 999,
                  fontSize: 11, fontWeight: 800,
                  background: statusBg, color: statusFg,
                }}>
                  {statusLabel}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
