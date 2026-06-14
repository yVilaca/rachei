import { formatCurrency, getInitials } from '../../../lib/utils'
import type { Installment } from '../../../types'
import StatusBadge from './StatusBadge'
import { useAuthStore } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'

interface InstallmentRowProps {
  installment: Installment
  creditorId: string
  isLast: boolean
}

export default function InstallmentRow({ installment, creditorId, isLast }: InstallmentRowProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const { generateChargeLink, updateInstallmentStatus } = useAppStore()

  const isCreditor = currentUser?.id === creditorId

  const handleCharge = () => {
    const link = generateChargeLink(installment.id)
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copiado!\n\n${link}`)
    })
  }

  return (
    <>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand">
          {getInitials(installment.debtor.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A1F] truncate">{installment.debtor.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-extrabold text-[#1A1A1F]">{formatCurrency(installment.amount)}</p>
            <StatusBadge status={installment.status} />
          </div>
          <div className="mt-2 flex gap-2">
            {isCreditor && installment.status === 'pending' && (
              <button
                onClick={handleCharge}
                className="rounded-xl bg-brand-100 px-3 py-1.5 text-xs font-semibold text-brand"
              >
                Cobrar via WhatsApp
              </button>
            )}
            {isCreditor && installment.status === 'awaiting_confirmation' && (
              <>
                <button
                  onClick={() => updateInstallmentStatus(installment.id, 'paid')}
                  className="rounded-xl bg-[#E8F7F0] px-3 py-1.5 text-xs font-semibold text-positive"
                >
                  Confirmar recebimento
                </button>
                <button
                  onClick={() => updateInstallmentStatus(installment.id, 'pending')}
                  className="rounded-xl bg-[#F0F0F3] px-3 py-1.5 text-xs font-semibold text-muted"
                >
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {!isLast && <div className="mx-4 h-px bg-[#F0F0F3]" />}
    </>
  )
}
