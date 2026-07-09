import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/Toast'
import { debtService } from '../../services/debt.service'
import type { Debt, Installment } from '../../types'

// ── Root ───────────────────────────────────────────────────────────────────────

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [debt, setDebt] = useState<Debt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!id) return
    try {
      setError(null)
      const d = await debtService.getDebt(id)
      setDebt(d)
    } catch {
      setError('Dívida não encontrada ou sem acesso.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B6B76' }}>Carregando...</p>
      </div>
    )
  }

  if (error || !debt || !currentUser) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B6B76' }}>{error ?? 'Dívida não encontrada'}</p>
      </div>
    )
  }

  const isCreditor = debt.paidBy.id === currentUser.id
  const myInstallment = debt.installments.find(
    (i) => i.debtor.id === currentUser.id && debt.paidBy.id !== currentUser.id,
  )

  if (!isCreditor && myInstallment) {
    return <DebtorView debt={debt} installment={myInstallment} currentUser={currentUser} onRefresh={load} />
  }

  return <CreditorView debt={debt} currentUser={currentUser} onRefresh={load} />
}

// ── CreditorView ───────────────────────────────────────────────────────────────

function CreditorView({ debt, currentUser, onRefresh }: { debt: Debt; currentUser: { id: string; name: string }; onRefresh: () => void }) {
  const navigate = useNavigate()
  const { message: toastMsg, show: showToast } = useToast()

  const creditorName = debt.paidBy.id === currentUser.id ? 'Você' : debt.paidBy.name
  const splitLabel = debt.splitType === 'equal' ? 'Igualitária' : 'Personalizada'
  const paidCount = debt.installments.filter((i) => i.status === 'paid').length

  const handleCharge = async (inst: Installment) => {
    try {
      const token = await debtService.generateChargeLink(inst.id)
      const url = `${window.location.origin}/pagar/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Link copiado!')
    } catch {
      showToast('Erro ao gerar link.')
    }
  }

  const handleConfirm = async (inst: Installment) => {
    try {
      await debtService.confirmPayment(inst.id)
      onRefresh()
    } catch {
      showToast('Erro ao confirmar pagamento.')
    }
  }

  const handleReject = async (inst: Installment) => {
    try {
      await debtService.rejectPayment(inst.id)
      onRefresh()
    } catch {
      showToast('Erro ao rejeitar comprovante.')
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <Toast message={toastMsg} />
      <div style={{ background: 'linear-gradient(150deg,#FF5436,#FF8A3D)', padding: '52px 20px 26px', color: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontWeight: 700, fontSize: 14, color: '#fff', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 16, opacity: .95,
        }}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M7.5 1L1.5 7.5l6 6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <div style={{ fontSize: 13, opacity: .9, fontWeight: 600 }}>{debt.groupName}</div>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 26, margin: '3px 0 14px', letterSpacing: '-.01em' }}>
          {debt.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .85 }}>Valor total</div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>{formatCurrency(debt.totalAmountCents)}</div>
          </div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.3)' }} />
          <div>
            <div style={{ fontSize: 11, opacity: .85 }}>Quem pagou</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{creditorName}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ background: 'rgba(255,255,255,.2)', padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              {splitLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 20px 120px' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,.04)', marginBottom: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#6B6B76', fontWeight: 600 }}>Parcelas quitadas</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#15151A', marginTop: 2 }}>
              {paidCount} de {debt.installments.length}
            </div>
          </div>
          <ProgressBar value={paidCount} max={debt.installments.length} />
        </div>

        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 15, color: '#15151A', marginBottom: 12 }}>
          Parcelas por devedor
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {debt.installments.map((inst) => (
            <CreditorInstallmentCard
              key={inst.id}
              installment={inst}
              isOwn={inst.debtor.id === currentUser.id}
              onCharge={() => handleCharge(inst)}
              onConfirm={() => handleConfirm(inst)}
              onReject={() => handleReject(inst)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── DebtorView ─────────────────────────────────────────────────────────────────

function DebtorView({
  debt, installment, currentUser, onRefresh,
}: {
  debt: Debt; installment: Installment; currentUser: { id: string; name: string }; onRefresh: () => void
}) {
  const navigate = useNavigate()
  const { message: toastMsg, show: showToast } = useToast()
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofName, setProofName] = useState<string | null>(null)
  const [showOthers, setShowOthers] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const creditorName = debt.paidBy.name
  const creditorAv = avatarFor(debt.paidBy.id)

  const { status } = installment
  const paidCount = debt.installments.filter((i) => i.status === 'paid').length
  const totalCount = debt.installments.length
  const others = debt.installments.filter((i) => i.debtor.id !== currentUser.id)

  const isPending = status === 'pending'
  const isAwaiting = status === 'awaiting_confirmation'
  const isPaid = status === 'paid'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setProofFile(file); setProofName(file.name) }
  }

  const handleSubmit = async () => {
    if (sending) return
    setSending(true)
    try {
      const fileUrl = proofFile ? URL.createObjectURL(proofFile) : undefined
      await debtService.sendProof(installment.id, fileUrl)
      onRefresh()
    } catch {
      showToast('Erro ao declarar pagamento.')
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', fontFamily: '"Plus Jakarta Sans", sans-serif', paddingBottom: 120 }}>
      <Toast message={toastMsg} />
      <div style={{ background: '#fff', padding: '52px 20px 18px', borderBottom: '1px solid #EEEEF2' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontWeight: 700, fontSize: 14, color: '#6B6B76', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 14,
        }}>
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M7.5 1L1.5 7.5l6 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <div style={{ fontSize: 12, color: '#6B6B76', fontWeight: 600, marginBottom: 2 }}>{debt.groupName ?? ''}</div>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 22, color: '#15151A', letterSpacing: '-.01em' }}>
          {debt.description}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: isPaid ? '#E9F9F0' : '#fff',
          borderRadius: 22, padding: '20px 20px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,.06)',
          border: isPaid ? '1.5px solid #BEE9D2' : isAwaiting ? '1.5px solid #FCE6C0' : '1.5px solid #FFE0D2',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, color: '#6B6B76', fontWeight: 600, marginBottom: 6 }}>
            {isPaid ? 'Você pagou' : 'Você deve'}
          </div>
          <div style={{
            fontFamily: '"Bricolage Grotesque"', fontWeight: 800,
            fontSize: 42, letterSpacing: '-.02em',
            color: isPaid ? '#0E8F5C' : '#FF5436',
            lineHeight: 1.05, marginBottom: 16,
          }}>
            {formatCurrency(installment.amountCents)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: creditorAv.bg, color: creditorAv.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {getInitials(creditorName)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B76', fontWeight: 600 }}>{isPaid ? 'Confirmado por' : 'Para'}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1A1F' }}>{creditorName}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <StatusPill status={status} />
            </div>
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: 16, padding: '13px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,.04)', marginBottom: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#6B6B76', fontWeight: 600 }}>Progresso do grupo</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#15151A', marginTop: 2 }}>
              {paidCount} de {totalCount} pagaram
            </div>
          </div>
          <ProgressBar value={paidCount} max={totalCount} />
        </div>

        {isPending && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,.04)', marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#6B6B76', letterSpacing: '.05em', marginBottom: 12 }}>
              ANEXAR COMPROVANTE
            </div>
            <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileChange} />
            {proofName ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#E9F9F0', border: '1px solid #BEE9D2',
                borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{
                  width: 40, height: 48, borderRadius: 7,
                  background: '#fff', border: '1px solid #BEE9D2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>🧾</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0E8F5C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proofName}</div>
                  <div style={{ fontSize: 11.5, color: '#3BA877' }}>anexado ✓</div>
                </div>
                <button onClick={() => inputRef.current?.click()} style={{
                  fontSize: 12, color: '#3BA877', fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}>Trocar</button>
              </div>
            ) : (
              <button onClick={() => inputRef.current?.click()} style={{
                width: '100%', border: '2px dashed #D8D8DF', borderRadius: 14,
                padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
                background: 'transparent',
              }}>
                <div style={{ fontSize: 26 }}>📎</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#6B6B76', marginTop: 6 }}>
                  Toque para anexar imagem ou PDF
                </div>
                <div style={{ fontSize: 11.5, color: '#A5A5AE', marginTop: 2 }}>
                  comprovante de Pix, transferência, etc.
                </div>
              </button>
            )}
          </div>
        )}


        {isPaid && (
          <div style={{
            background: '#E9F9F0', border: '1px solid #BEE9D2',
            borderRadius: 16, padding: '16px 18px', marginBottom: 14,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0E8F5C' }}>Pagamento confirmado!</div>
              <div style={{ fontSize: 12.5, color: '#3BA877', marginTop: 3 }}>
                {creditorName} confirmou o recebimento.
                {installment.confirmedAt ? ` Em ${formatDate(installment.confirmedAt)}.` : ''}
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 18, padding: 18,
          boxShadow: '0 2px 10px rgba(0,0,0,.04)', marginBottom: 14,
        }}>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 14, color: '#15151A', marginBottom: 14 }}>
            Detalhes da dívida
          </div>
          {([
            ['Grupo', debt.groupName ?? '—'],
            ['Data', formatDate(debt.createdAt)],
            ['Divisão', debt.splitType === 'equal' ? 'Igualitária' : 'Personalizada'],
            ['Total da despesa', formatCurrency(debt.totalAmountCents)],
            ['Sua parte', formatCurrency(installment.amountCents)],
          ] as [string, string][]).map(([label, value], i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: i < arr.length - 1 ? 11 : 0,
              marginBottom: i < arr.length - 1 ? 11 : 0,
              borderBottom: i < arr.length - 1 ? '1px solid #F0F0F4' : 'none',
            }}>
              <span style={{ fontSize: 13.5, color: '#6B6B76' }}>{label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1A1F' }}>{value}</span>
            </div>
          ))}
        </div>

        {others.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
            <button
              onClick={() => setShowOthers((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 14, color: '#15151A' }}>
                Outros participantes
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#6B6B76' }}>{others.length}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: showOthers ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }}>
                  <path d="M3 5l4 4 4-4" stroke="#6B6B76" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            {showOthers && (
              <div style={{ padding: '0 18px 14px', borderTop: '1px solid #F0F0F4' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                  {others.map((inst) => {
                    const av = avatarFor(inst.debtor.id)
                    const st = inst.status === 'paid'
                      ? { label: 'Pago', color: '#0E8F5C' }
                      : inst.status === 'awaiting_confirmation'
                      ? { label: 'Aguardando', color: '#B57400' }
                      : { label: 'Pendente', color: '#FF5436' }
                    return (
                      <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: av.bg, color: av.fg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 11,
                        }}>
                          {getInitials(inst.debtor.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1A1F' }}>{inst.debtor.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#15151A' }}>{formatCurrency(inst.amountCents)}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: st.color }}>{st.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {isPending && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 22px 36px',
          background: 'linear-gradient(0deg, #fff 70%, rgba(255,255,255,0))',
          zIndex: 10,
        }}>
          <button
            onClick={handleSubmit}
            disabled={sending}
            style={{
              width: '100%', padding: 16, borderRadius: 16,
              fontWeight: 800, fontSize: 16, border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              background: sending ? '#EBEBEF' : 'linear-gradient(135deg,#FF5436,#FF8A3D)',
              color: sending ? '#6B6B76' : '#fff',
              boxShadow: sending ? 'none' : '0 8px 18px rgba(255,84,54,.3)',
              transition: 'background .2s, box-shadow .2s',
            }}
          >
            {sending ? 'Enviando...' : proofFile ? 'Enviar comprovante' : 'Já paguei'}
          </button>
          {!proofFile && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#A5A5AE', marginTop: 8 }}>
              Ou anexe um comprovante acima para maior segurança
            </div>
          )}
        </div>
      )}

      {isAwaiting && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 22px 36px',
          background: 'linear-gradient(0deg, #fff 70%, rgba(255,255,255,0))',
          zIndex: 10,
        }}>
          <div style={{
            width: '100%', padding: 16, borderRadius: 16,
            fontWeight: 700, fontSize: 15, textAlign: 'center',
            background: '#FFF8EE', color: '#B57400',
          }}>
            ⏳ Aguardando confirmação de {creditorName}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CreditorInstallmentCard ────────────────────────────────────────────────────

interface CICardProps {
  installment: Installment
  isOwn: boolean
  onCharge: () => void
  onConfirm: () => void
  onReject: () => void
}

function CreditorInstallmentCard({ installment, isOwn, onCharge, onConfirm, onReject }: CICardProps) {
  const av = avatarFor(installment.debtor.id)
  const { status } = installment

  const statusMap = {
    pending: { label: 'Pendente', color: '#FF5436', sub: 'Aguardando pagamento' },
    awaiting_confirmation: { label: 'Aguardando', color: '#B57400', sub: 'Comprovante enviado' },
    paid: { label: 'Pago', color: '#0E8F5C', sub: 'Quitado' },
  } as const

  const st = statusMap[status as keyof typeof statusMap] ?? statusMap.pending

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: 15, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}>
          {getInitials(installment.debtor.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>
            {isOwn ? 'Você (sua parte)' : installment.debtor.name}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>{st.sub}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#15151A' }}>{formatCurrency(installment.amountCents)}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: st.color, marginTop: 1 }}>{st.label}</div>
        </div>
      </div>

      {status === 'pending' && !isOwn && (
        <button onClick={onCharge} style={{
          marginTop: 13, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#E9F9F0', color: '#0E8F5C',
          fontWeight: 800, fontSize: 14, padding: 12,
          borderRadius: 13, cursor: 'pointer', border: 'none',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#0E8F5C">
            <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm5.5 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.8c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2z"/>
          </svg>
          Cobrar no WhatsApp
        </button>
      )}

      {status === 'awaiting_confirmation' && (
        <div style={{ marginTop: 13 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#FFF8EE', border: '1px solid #FCE6C0',
            borderRadius: 12, padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{
              width: 38, height: 46, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(135deg,#E8E8EE,#F4F4F8)',
              border: '1px solid #DADAE2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🧾</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1A1A1F' }}>
                {installment.proof ? 'Comprovante recebido' : 'Pagamento declarado'}
              </div>
              <div style={{ fontSize: 11, color: '#A88A4E' }}>Por {installment.debtor.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onReject} style={{
              flex: 1, textAlign: 'center', padding: 11, borderRadius: 12,
              fontWeight: 800, fontSize: 13.5, background: '#FFEDE8', color: '#E0431F',
              border: 'none', cursor: 'pointer',
            }}>Rejeitar</button>
            <button onClick={onConfirm} style={{
              flex: 2, textAlign: 'center', padding: 11, borderRadius: 12,
              fontWeight: 800, fontSize: 13.5, background: '#11A36B', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}>Confirmar recebimento</button>
          </div>
        </div>
      )}

      {status === 'paid' && (
        <div style={{
          marginTop: 13, textAlign: 'center',
          background: '#E9F9F0', color: '#0E8F5C',
          fontWeight: 700, fontSize: 12.5, padding: 10, borderRadius: 12,
        }}>
          ✓ Pagamento confirmado
        </div>
      )}
    </div>
  )
}

// ── StatusPill ─────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map = {
    pending: { label: 'Pendente', bg: '#FFF0ED', color: '#FF5436' },
    awaiting_confirmation: { label: 'Aguardando', bg: '#FFF8EE', color: '#B57400' },
    paid: { label: 'Pago', bg: '#E9F9F0', color: '#0E8F5C' },
  } as const
  const s = map[status as keyof typeof map] ?? map.pending
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 800,
      padding: '4px 10px', borderRadius: 999,
    }}>
      {s.label}
    </span>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? '#0E8F5C' : '#FF5436' }}>{pct}%</span>
      <div style={{ width: 80, height: 6, borderRadius: 999, background: '#F0F0F4' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: pct === 100 ? '#0E8F5C' : 'linear-gradient(90deg,#FF5436,#FF8A3D)',
          width: `${pct}%`, transition: 'width .4s',
        }} />
      </div>
    </div>
  )
}
