import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import InstallmentRow from './components/InstallmentRow'

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { debts, groups } = useAppStore()

  const debt = debts.find((d) => d.id === id)
  if (!debt) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted">Dívida não encontrada</p>
      </div>
    )
  }

  const group = groups.find((g) => g.id === debt.groupId)
  const creditor = group?.members.find((m) => m.userId === debt.paidByUserId)?.user
  const pendingCount = debt.installments.filter((i) => i.status !== 'paid').length

  return (
    <div className="min-h-dvh bg-surface pb-10">
      <div
        className="px-5 pt-14 pb-6 text-white"
        style={{ background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-semibold text-white/80"
          aria-label="Voltar"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">{debt.description}</h1>
        <p className="mt-1 text-sm text-white/80">{group?.name} · {formatDate(debt.createdAt)}</p>
        <div className="mt-4 flex items-center gap-3">
          <p className="font-heading text-3xl font-extrabold">{formatCurrency(debt.totalAmount)}</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pendingCount === 0 ? 'bg-white/20' : 'bg-black/20'}`}>
            {pendingCount === 0 ? 'Quitada' : `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {creditor && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {getInitials(creditor.name)}
          </div>
          <div>
            <p className="text-xs text-muted">Pago por</p>
            <p className="text-sm font-bold text-[#1A1A1F]">
              {creditor.id === currentUser?.id ? 'Você' : creditor.name}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted">Divisão</p>
            <p className="text-xs font-semibold text-[#1A1A1F]">
              {debt.splitType === 'equal' ? 'Igualitária' : 'Personalizada'}
            </p>
          </div>
        </div>
      )}

      <div className="mx-5 mt-4">
        <h2 className="font-heading text-sm font-bold text-[#15151A] mb-3">Parcelas</h2>
        <div className="rounded-3xl bg-white shadow-card">
          {debt.installments.map((inst, i) => (
            <InstallmentRow
              key={inst.id}
              installment={inst}
              creditorId={debt.paidByUserId}
              isLast={i === debt.installments.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
