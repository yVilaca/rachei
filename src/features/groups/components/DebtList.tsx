import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../../lib/utils'
import type { Debt } from '../../../types'

interface DebtListProps {
  debts: Debt[]
}

type Filter = 'all' | 'pending' | 'paid'

export default function DebtList({ debts }: DebtListProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()

  const filtered = debts.filter((debt) => {
    if (filter === 'all') return true
    const hasAnyPending = debt.installments.some((i) => i.status !== 'paid')
    return filter === 'pending' ? hasAnyPending : !hasAnyPending
  })

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'paid', label: 'Quitadas' },
  ]

  return (
    <div className="px-5 mt-5">
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab.key ? 'bg-brand text-white' : 'bg-white text-muted shadow-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted py-6">Nenhuma dívida encontrada</p>
        )}
        {filtered.map((debt) => {
          const pendingCount = debt.installments.filter((i) => i.status !== 'paid').length
          const isFullyPaid = pendingCount === 0

          return (
            <button
              key={debt.id}
              onClick={() => navigate(`/dividas/${debt.id}`)}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card text-left w-full"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-[#1A1A1F]">{debt.description}</p>
                <p className="text-xs text-muted mt-0.5">{formatDate(debt.createdAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-extrabold text-[#1A1A1F]">{formatCurrency(debt.totalAmount)}</p>
                <span
                  className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isFullyPaid ? 'bg-[#E8F7F0] text-positive' : 'bg-brand-100 text-brand'
                  }`}
                >
                  {isFullyPaid ? 'Quitada' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
