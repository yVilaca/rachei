import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'
import { getInitials } from '../../../lib/utils'
import type { SplitType } from '../../../types'

interface DebtFormProps {
  groupId: string
}

const LABEL: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, color: '#6B6B76', letterSpacing: '0.04em', marginBottom: 8,
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function DebtForm({ groupId }: DebtFormProps) {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { groups, addDebt } = useAppStore()

  const group = groups.find((g) => g.id === groupId)!

  // ── state ────────────────────────────────────────────────────────────────
  const [amountCents, setAmountCents] = useState(0)
  const [description, setDescription] = useState('')
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id ?? '')
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>(
    group.members.map((m) => m.userId),
  )
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [customCents, setCustomCents] = useState<Record<string, number>>({})

  // touched flags for inline errors
  const [touchedDesc, setTouchedDesc] = useState(false)
  const [touchedAmount, setTouchedAmount] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500)
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // ── derived ──────────────────────────────────────────────────────────────
  const total = amountCents / 100
  const selectedCount = selectedDebtors.length
  const equalShareCents = selectedCount > 0 ? Math.floor(amountCents / selectedCount) : 0
  // Distribute rounding remainder to first debtor
  const equalRemainder = amountCents - equalShareCents * selectedCount

  const customSumCents = selectedDebtors.reduce((acc, id) => acc + (customCents[id] ?? 0), 0)
  const diffCents = amountCents - customSumCents // positive = under, negative = over

  const splitOk = splitType === 'equal'
    ? selectedCount > 0
    : Math.abs(diffCents) < 1 // within 1 cent

  const hasExternalDebtor = selectedDebtors.some((id) => id !== paidByUserId)

  // Per-debtor custom validation
  const zeroCentDebtors = splitType === 'custom'
    ? selectedDebtors.filter((id) => (customCents[id] ?? 0) === 0)
    : []

  // ── error messages ───────────────────────────────────────────────────────
  const descError = !description.trim() ? 'Informe uma descrição' : null
  const amountError = amountCents === 0 ? 'Informe o valor total' : null
  const debtorError = selectedCount === 0
    ? 'Selecione ao menos um participante'
    : !hasExternalDebtor
    ? 'Inclua ao menos um amigo na divisão'
    : null
  const splitError = splitType === 'custom' && !splitOk
    ? diffCents > 0
      ? `Faltam R$ ${fmt(diffCents)} para distribuir`
      : `Excede o total em R$ ${fmt(Math.abs(diffCents))}`
    : null
  const zeroCentsError = zeroCentDebtors.length > 0 && splitType === 'custom'
    ? 'Defina o valor de cada participante selecionado'
    : null

  const formError = descError ?? amountError ?? debtorError ?? splitError ?? zeroCentsError ?? null
  const canSubmit = !formError

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouchedAmount(true)
    const digits = e.target.value.replace(/\D/g, '').replace(/^0+/, '') || '0'
    setAmountCents(Math.min(parseInt(digits, 10), 99999999)) // cap at R$999.999,99
  }

  const toggleDebtor = (userId: string) => {
    setSelectedDebtors((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleCustomCents = (userId: string, raw: string) => {
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '') || '0'
    setCustomCents((prev) => ({ ...prev, [userId]: parseInt(digits, 10) }))
  }

  const handleSubmit = () => {
    setSubmitAttempted(true)
    setTouchedDesc(true)
    setTouchedAmount(true)
    if (!canSubmit) {
      showToast(formError!)
      return
    }

    const debtors = selectedDebtors.map((userId, idx) => ({
      userId,
      amount: splitType === 'equal'
        ? (equalShareCents + (idx === 0 ? equalRemainder : 0)) / 100
        : (customCents[userId] ?? 0) / 100,
    }))

    addDebt({ groupId, description, totalAmount: total, paidByUserId, splitType, debtors })
    navigate(`/grupos/${groupId}`)
  }

  // ── render ────────────────────────────────────────────────────────────────
  const showDescError = touchedDesc && !!descError
  const showAmountError = touchedAmount && !!amountError

  return (
    <div style={{ padding: '8px 22px 160px', position: 'relative' }}>

      {/* GRUPO */}
      <div style={{ marginTop: 14 }}>
        <div style={LABEL}>GRUPO</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 14, fontWeight: 700, fontSize: 13,
            background: '#FFF0ED', color: '#FF5436', border: '1.5px solid #FF5436',
          }}>
            <span>{group.emoji}</span>{group.name}
          </div>
        </div>
      </div>

      {/* VALOR TOTAL */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL}>VALOR TOTAL</div>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F7F7FA',
          border: `1.5px solid ${showAmountError ? '#E0431F' : '#ECECF0'}`,
          borderRadius: 16, padding: '4px 18px',
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: amountCents > 0 ? '#15151A' : '#9A9AA4' }}>R$</span>
          <input
            inputMode="numeric"
            placeholder="0,00"
            value={amountCents > 0 ? fmt(amountCents) : ''}
            onChange={handleAmountInput}
            onBlur={() => setTouchedAmount(true)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 800, fontSize: 30, color: '#15151A',
              padding: '12px 8px', width: '100%', outline: 'none',
            }}
          />
        </div>
        {showAmountError && (
          <p style={{ fontSize: 12, color: '#E0431F', fontWeight: 600, marginTop: 5 }}>{amountError}</p>
        )}
      </div>

      {/* DESCRIÇÃO */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL}>DESCRIÇÃO</div>
        <input
          placeholder="Ex: Rodízio japonês 🍣"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setTouchedDesc(true)}
          style={{
            width: '100%',
            border: `1.5px solid ${showDescError ? '#E0431F' : '#ECECF0'}`,
            borderRadius: 16, padding: '14px 16px', fontSize: 15,
            color: '#15151A', background: '#F7F7FA', outline: 'none',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        />
        {showDescError && (
          <p style={{ fontSize: 12, color: '#E0431F', fontWeight: 600, marginTop: 5 }}>{descError}</p>
        )}
      </div>

      {/* QUEM PAGOU */}
      <div style={{ marginTop: 22 }}>
        <div style={LABEL}>QUEM PAGOU (CREDOR)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {group.members.map((m) => {
            const active = paidByUserId === m.userId
            return (
              <button key={m.userId} type="button" onClick={() => setPaidByUserId(m.userId)}
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
          <span style={LABEL}>QUEM DIVIDE</span>
          <span style={{ fontSize: 11.5, color: '#9A9AA4' }}>
            {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.members.map((m) => {
            const isSelected = selectedDebtors.includes(m.userId)
            const isPayer = m.userId === paidByUserId
            const myShareCents = isSelected
              ? splitType === 'equal'
                ? equalShareCents
                : (customCents[m.userId] ?? 0)
              : 0
            const hasZeroCustom = isSelected && splitType === 'custom' && (customCents[m.userId] ?? 0) === 0

            return (
              <button key={m.userId} type="button" onClick={() => toggleDebtor(m.userId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 15, cursor: 'pointer',
                  background: isSelected ? '#FFF0ED' : '#fff',
                  border: `1.5px solid ${hasZeroCustom && submitAttempted ? '#E0431F' : isSelected ? '#FF5436' : '#ECECF0'}`,
                  textAlign: 'left',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? '#FFD6CC' : '#F0F0F4',
                  color: isSelected ? '#FF5436' : '#6B6B76',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12,
                }}>
                  {getInitials(m.user.name)}
                </div>

                {/* Name + badge */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1A1A1F' }}>
                    {m.user.name.split(' ')[0]}
                  </span>
                  {isPayer && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#0E8F5C',
                      background: '#E9F9F0', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}>minha parte</span>
                  )}
                </div>

                {/* Share amount or custom input */}
                {isSelected && splitType === 'equal' && amountCents > 0 && (
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#11A36B', flexShrink: 0 }}>
                    R$ {fmt(myShareCents)}
                  </span>
                )}
                {isSelected && splitType === 'custom' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                      background: '#fff',
                      border: `1.5px solid ${hasZeroCustom && submitAttempted ? '#E0431F' : '#ECECF0'}`,
                      borderRadius: 10, padding: '5px 10px',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#9A9AA4', fontWeight: 700 }}>R$</span>
                    <input
                      inputMode="numeric"
                      placeholder="0,00"
                      value={(customCents[m.userId] ?? 0) > 0 ? fmt(customCents[m.userId] ?? 0) : ''}
                      onChange={(e) => handleCustomCents(m.userId, e.target.value)}
                      style={{
                        width: 68, border: 'none', background: 'transparent',
                        fontWeight: 800, fontSize: 14, color: '#15151A',
                        textAlign: 'right', outline: 'none',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                      }}
                    />
                  </div>
                )}

                {/* Checkbox */}
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? '#FF5436' : 'transparent',
                  border: `2px solid ${isSelected ? '#FF5436' : '#D0D0D8'}`,
                }}>
                  {isSelected && (
                    <svg width="13" height="11" viewBox="0 0 13 11">
                      <path d="M1.5 5.5L5 9l6.5-7.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* DIVISÃO */}
      {selectedCount > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={LABEL}>DIVISÃO</div>
          <div style={{ display: 'flex', background: '#F0F0F4', borderRadius: 14, padding: 4 }}>
            {(['equal', 'custom'] as SplitType[]).map((type) => {
              const active = splitType === type
              return (
                <button key={type} type="button" onClick={() => setSplitType(type)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '10px',
                    borderRadius: 11, fontWeight: 700, fontSize: 13.5,
                    cursor: 'pointer', border: 'none',
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

          {/* Equal split summary */}
          {splitType === 'equal' && amountCents > 0 && selectedCount > 0 && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#E9F9F0', borderRadius: 12, padding: '11px 14px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0E8F5C' }}>
                R$ {fmt(equalShareCents)} por pessoa
              </span>
              <span style={{ fontSize: 12, color: '#3BA877' }}>
                {selectedCount} pessoas · Total correto ✓
              </span>
            </div>
          )}

          {/* Custom split live feedback */}
          {splitType === 'custom' && amountCents > 0 && (
            <div style={{
              marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: splitOk ? '#E9F9F0' : diffCents < 0 ? '#FFF0ED' : '#FFFBEC',
              border: `1px solid ${splitOk ? '#BEE9D2' : diffCents < 0 ? '#FFD6CC' : '#FFE99A'}`,
              borderRadius: 12, padding: '11px 14px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: splitOk ? '#0E8F5C' : diffCents < 0 ? '#E0431F' : '#B07D00' }}>
                {splitOk
                  ? 'Total correto ✓'
                  : diffCents > 0
                  ? `Faltam distribuir`
                  : `Excede o total`}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: splitOk ? '#0E8F5C' : diffCents < 0 ? '#E0431F' : '#B07D00' }}>
                {splitOk
                  ? `R$ ${fmt(amountCents)}`
                  : `R$ ${fmt(Math.abs(diffCents))}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', top: 24, left: 22, right: 22, zIndex: 100,
        pointerEvents: 'none',
        transition: 'opacity .25s, transform .25s',
        opacity: toastMsg ? 1 : 0,
        transform: toastMsg ? 'translateY(0)' : 'translateY(-12px)',
      }}>
        <div style={{
          background: '#1A1A1F', color: '#fff', borderRadius: 14,
          padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.22)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#FF5436" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#FF5436" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{toastMsg}</span>
        </div>
      </div>

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
          style={{
            width: '100%', textAlign: 'center', padding: 16,
            borderRadius: 16, fontWeight: 800, fontSize: 16,
            cursor: 'pointer', border: 'none',
            background: canSubmit || !submitAttempted
              ? 'linear-gradient(135deg,#FF5436,#FF8A3D)'
              : '#ECECF0',
            color: canSubmit || !submitAttempted ? '#fff' : '#9A9AA4',
            boxShadow: canSubmit || !submitAttempted ? '0 8px 18px rgba(255,84,54,.3)' : 'none',
          }}
        >
          Registrar dívida
        </button>
      </div>
    </div>
  )
}
