import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'
import { getInitials } from '../../../lib/utils'
import type { SplitType } from '../../../types'

interface DebtFormProps {
  groupId: string
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, color: '#6B6B76', letterSpacing: '0.04em',
  marginBottom: 8,
}

export default function DebtForm({ groupId }: DebtFormProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { groups, addDebt } = useAppStore()

  const group = groups.find((g) => g.id === groupId)!

  const [amountDisplay, setAmountDisplay] = useState('')
  const [description, setDescription] = useState('')
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id ?? '')
  // All members selected by default (including the payer — their share is auto-marked paid)
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>(group.members.map((m) => m.userId))
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({})
  const [error, setError] = useState('')

  const total = parseFloat(amountDisplay.replace(',', '.')) || 0

  // All members are eligible — payer can include their own share
  const eligibleDebtors = group.members

  const debtorRows = eligibleDebtors.map((m) => {
    const isSelected = selectedDebtors.includes(m.userId)
    const selectedCount = selectedDebtors.length
    const equalShare = isSelected && selectedCount > 0 ? total / selectedCount : 0
    return {
      userId: m.userId,
      name: m.user.name,
      initials: getInitials(m.user.name),
      isSelected,
      equalShare,
      customAmount: customAmounts[m.userId] ?? 0,
    }
  })

  const customSum = debtorRows
    .filter((d) => d.isSelected)
    .reduce((acc, d) => acc + (customAmounts[d.userId] ?? 0), 0)

  const splitOk = splitType === 'equal' || Math.abs(total - customSum) < 0.01
  const canSubmit = description.trim() && total > 0 && selectedDebtors.length > 0 && splitOk

  const handleSubmit = () => {
    setError('')
    if (!description.trim()) { setError('Informe uma descrição'); return }
    if (total <= 0) { setError('Valor deve ser maior que R$ 0,01'); return }
    if (selectedDebtors.length === 0) { setError('Selecione ao menos um devedor'); return }
    if (splitType === 'custom' && !splitOk) { setError('A soma das parcelas deve ser igual ao total'); return }

    const debtors = selectedDebtors.map((userId) => {
      const count = selectedDebtors.length
      return {
        userId,
        amount: splitType === 'equal' ? total / count : (customAmounts[userId] ?? 0),
      }
    })

    addDebt({ groupId, description, totalAmount: total, paidByUserId, splitType, debtors })
    navigate(`/grupos/${groupId}`)
  }

  const toggleDebtor = (userId: string) => {
    setSelectedDebtors((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  return (
    <div style={{ padding: '8px 22px 160px', position: 'relative' }}>
      {/* GRUPO */}
      <div style={{ marginTop: 14 }}>
        <div style={LABEL_STYLE}>GRUPO</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 14px', borderRadius: 14, fontWeight: 700, fontSize: 13,
              background: '#FFF0ED', color: '#FF5436', border: '1.5px solid #FF5436',
            }}
          >
            <span>{group.emoji}</span>{group.name}
          </div>
        </div>
      </div>

      {/* VALOR TOTAL */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL_STYLE}>VALOR TOTAL</div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F7F7FA', border: '1.5px solid #ECECF0',
          borderRadius: 16, padding: '4px 18px',
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#9A9AA4' }}>R$</span>
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={amountDisplay}
            onChange={(e) => setAmountDisplay(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800, fontSize: 30, color: '#15151A',
              padding: '12px 8px', width: '100%', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL_STYLE}>DESCRIÇÃO</div>
        <input
          placeholder="Ex: Rodízio japonês 🍣"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: '100%', border: '1.5px solid #ECECF0',
            borderRadius: 16, padding: '14px 16px', fontSize: 15,
            color: '#15151A', background: '#F7F7FA', outline: 'none',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        />
      </div>

      {/* QUEM PAGOU */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL_STYLE}>QUEM PAGOU (CREDOR)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {group.members.map((m) => {
            const active = paidByUserId === m.userId
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => {
                  setPaidByUserId(m.userId)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 13px 8px 8px', borderRadius: 999,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  background: active ? '#FFF0ED' : '#fff',
                  color: active ? '#FF5436' : '#3A3A42',
                  border: `1.5px solid ${active ? '#FF5436' : '#ECECF0'}`,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: active ? '#FF5436' : '#F0F0F4',
                  color: active ? '#fff' : '#6B6B76',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 10,
                }}>
                  {getInitials(m.user.name)}
                </div>
                {m.user.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>

      {/* QUEM DEVE */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={LABEL_STYLE}>QUEM DEVE</span>
          <span style={{ fontSize: 11.5, color: '#9A9AA4' }}>
            {selectedDebtors.length} selecionado{selectedDebtors.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {debtorRows.map((d) => (
            <button
              key={d.userId}
              type="button"
              onClick={() => toggleDebtor(d.userId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 15, cursor: 'pointer',
                background: d.isSelected ? '#FFF0ED' : '#fff',
                border: `1.5px solid ${d.isSelected ? '#FF5436' : '#ECECF0'}`,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: d.isSelected ? '#FFD6CC' : '#F0F0F4',
                color: d.isSelected ? '#FF5436' : '#6B6B76',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12,
              }}>
                {d.initials}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F' }}>
                  {d.name.split(' ')[0]}
                </span>
                {d.userId === paidByUserId && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: '#0E8F5C',
                    background: '#E9F9F0', padding: '2px 7px', borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}>
                    minha parte
                  </span>
                )}
              </div>
              {d.isSelected && splitType === 'equal' && total > 0 && (
                <span style={{ fontWeight: 800, fontSize: 14, color: '#11A36B' }}>
                  R$ {(d.equalShare).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
              {d.isSelected && splitType === 'custom' && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: '#fff', border: '1.5px solid #ECECF0',
                    borderRadius: 10, padding: '5px 10px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span style={{ fontSize: 12, color: '#9A9AA4', fontWeight: 700 }}>R$</span>
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={customAmounts[d.userId] !== undefined ? customAmounts[d.userId].toString() : ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0
                      setCustomAmounts((prev) => ({ ...prev, [d.userId]: v }))
                    }}
                    style={{
                      width: 62, border: 'none', background: 'transparent',
                      fontWeight: 800, fontSize: 14, color: '#15151A',
                      textAlign: 'right', outline: 'none',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                    }}
                  />
                </div>
              )}
              <div style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: d.isSelected ? '#FF5436' : 'transparent',
                border: `2px solid ${d.isSelected ? '#FF5436' : '#D0D0D8'}`,
              }}>
                {d.isSelected && (
                  <svg width="13" height="11" viewBox="0 0 13 11">
                    <path d="M1.5 5.5L5 9l6.5-7.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DIVISÃO */}
      {selectedDebtors.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={LABEL_STYLE}>DIVISÃO</div>
          <div style={{ display: 'flex', background: '#F0F0F4', borderRadius: 14, padding: 4 }}>
            {(['equal', 'custom'] as SplitType[]).map((type) => {
              const active = splitType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '10px',
                    borderRadius: 11, fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                    border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#15151A' : '#9A9AA4',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                  }}
                >
                  {type === 'equal' ? 'Igual' : 'Personalizado'}
                </button>
              )
            })}
          </div>

          {/* Split info */}
          {total > 0 && splitType === 'custom' && selectedDebtors.length > 0 && (
            <div style={{
              marginTop: 12, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              background: splitOk ? '#E9F9F0' : '#FFF0ED',
              borderRadius: 14, padding: '13px 16px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: splitOk ? '#0E8F5C' : '#E0431F' }}>
                {splitOk ? 'Total correto ✓' : 'Faltam distribuir'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: splitOk ? '#0E8F5C' : '#E0431F' }}>
                {splitOk
                  ? `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : `R$ ${Math.abs(total - customSum).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#E0431F' }}>{error}</p>
      )}

      {/* Sticky submit */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '14px 22px 34px',
        background: 'linear-gradient(0deg, #fff 70%, rgba(255,255,255,0))',
        zIndex: 10,
      }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', textAlign: 'center', padding: 16,
            borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: canSubmit ? 'pointer' : 'not-allowed',
            border: 'none',
            background: canSubmit
              ? 'linear-gradient(135deg,#FF5436,#FF8A3D)'
              : '#ECECF0',
            color: canSubmit ? '#fff' : '#9A9AA4',
            boxShadow: canSubmit ? '0 8px 18px rgba(255,84,54,.3)' : 'none',
          }}
        >
          {canSubmit ? 'Registrar dívida' : 'Preencha os campos acima'}
        </button>
      </div>
    </div>
  )
}
