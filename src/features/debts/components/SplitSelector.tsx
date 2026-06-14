import type { SplitType } from '../../../types'

interface Debtor {
  userId: string
  name: string
  amount: number
}

interface SplitSelectorProps {
  splitType: SplitType
  onSplitTypeChange: (type: SplitType) => void
  debtors: Debtor[]
  onAmountChange: (userId: string, amount: number) => void
  totalAmount: number
}

export default function SplitSelector({
  splitType,
  onSplitTypeChange,
  debtors,
  onAmountChange,
  totalAmount,
}: SplitSelectorProps) {
  const splitSum = debtors.reduce((acc, d) => acc + d.amount, 0)
  const diff = Math.abs(totalAmount - splitSum)
  const isValid = diff < 0.01

  return (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-2xl bg-[#F0F0F3] p-1">
        <button
          type="button"
          onClick={() => onSplitTypeChange('equal')}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
            splitType === 'equal' ? 'bg-white text-[#15151A] shadow-card' : 'text-muted'
          }`}
        >
          Igualitária
        </button>
        <button
          type="button"
          onClick={() => onSplitTypeChange('custom')}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
            splitType === 'custom' ? 'bg-white text-[#15151A] shadow-card' : 'text-muted'
          }`}
        >
          Personalizada
        </button>
      </div>

      {debtors.map((debtor) => (
        <div key={debtor.userId} className="flex items-center gap-3">
          <p className="flex-1 text-sm font-semibold text-[#1A1A1F] truncate">{debtor.name}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={debtor.amount || ''}
              disabled={splitType === 'equal'}
              onChange={(e) => onAmountChange(debtor.userId, parseFloat(e.target.value) || 0)}
              className="w-24 rounded-xl border border-border bg-[#FAFAFC] px-3 py-2 text-right text-sm font-semibold disabled:opacity-60"
            />
          </div>
        </div>
      ))}

      {splitType === 'custom' && debtors.length > 0 && (
        <p className={`text-xs font-semibold ${isValid ? 'text-positive' : 'text-brand'}`}>
          {isValid
            ? '✓ Valores conferem com o total'
            : `Diferença de R$ ${diff.toFixed(2)} em relação ao total`}
        </p>
      )}
    </div>
  )
}
