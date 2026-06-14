import type { InstallmentStatus } from '../../../types'

const STATUS_CONFIG: Record<InstallmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-brand-100 text-brand' },
  awaiting_confirmation: { label: 'Aguardando', className: 'bg-yellow-50 text-yellow-600' },
  paid: { label: 'Quitada', className: 'bg-[#E8F7F0] text-positive' },
}

export default function StatusBadge({ status }: { status: InstallmentStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
