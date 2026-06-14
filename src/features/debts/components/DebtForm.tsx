import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import SplitSelector from './SplitSelector'
import { getInitials } from '../../../lib/utils'
import type { SplitType } from '../../../types'

interface DebtFormProps {
  groupId: string
}

export default function DebtForm({ groupId }: DebtFormProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { groups, addDebt } = useAppStore()

  const group = groups.find((g) => g.id === groupId)!
  const otherMembers = group.members.filter((m) => m.userId !== currentUser?.id)

  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id ?? '')
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>(otherMembers.map((m) => m.userId))
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [error, setError] = useState('')

  const total = parseFloat(totalAmount) || 0

  const debtors = selectedDebtors.map((userId) => {
    const member = group.members.find((m) => m.userId === userId)!
    const equalAmount = selectedDebtors.length > 0 ? total / selectedDebtors.length : 0
    return {
      userId,
      name: member.user.name,
      amount: splitType === 'equal' ? equalAmount : (customAmounts[userId] ?? 0),
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!description.trim()) return setError('Informe uma descrição')
    if (total <= 0) return setError('Valor deve ser maior que R$ 0,01')
    if (selectedDebtors.length === 0) return setError('Selecione ao menos um devedor')

    if (splitType === 'custom') {
      const sum = debtors.reduce((acc, d) => acc + d.amount, 0)
      if (Math.abs(total - sum) > 0.01) return setError('A soma das parcelas deve ser igual ao total')
    }

    addDebt({
      groupId,
      description,
      totalAmount: total,
      paidByUserId,
      splitType,
      debtors: debtors.map((d) => ({ userId: d.userId, amount: d.amount })),
    })

    navigate(`/grupos/${groupId}`)
  }

  const toggleDebtor = (userId: string) => {
    setSelectedDebtors((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 pb-10">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-[#15151A]">Descrição</Label>
        <Input
          placeholder="Ex: Rodízio japonês, conta do bar…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-[#15151A]">Valor total (R$)</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0,00"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="rounded-2xl border-border bg-[#FAFAFC] px-4 py-3.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-[#15151A]">Quem pagou?</Label>
        <div className="flex gap-2 flex-wrap">
          {group.members.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => setPaidByUserId(m.userId)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors ${
                paidByUserId === m.userId ? 'bg-brand text-white' : 'bg-white text-[#1A1A1F] shadow-card'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${paidByUserId === m.userId ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand'}`}>
                {getInitials(m.user.name)}
              </span>
              {m.user.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold text-[#15151A]">Quem deve?</Label>
        <div className="flex gap-2 flex-wrap">
          {group.members.filter((m) => m.userId !== paidByUserId).map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => toggleDebtor(m.userId)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors ${
                selectedDebtors.includes(m.userId) ? 'bg-brand text-white' : 'bg-white text-[#1A1A1F] shadow-card'
              }`}
            >
              {m.user.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {selectedDebtors.length > 0 && total > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-semibold text-[#15151A]">Divisão</Label>
          <SplitSelector
            splitType={splitType}
            onSplitTypeChange={setSplitType}
            debtors={debtors}
            onAmountChange={(userId, amount) => setCustomAmounts((prev) => ({ ...prev, [userId]: amount }))}
            totalAmount={total}
          />
        </div>
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      <Button
        type="submit"
        className="w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
      >
        Registrar dívida
      </Button>
    </form>
  )
}
