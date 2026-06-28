import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'
import { formatCurrency, getInitials } from '../../lib/utils'
import type { Installment } from '../../types'

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { debts, groups } = useAppStore()

  const debt = debts.find((d) => d.id === id)
  if (!debt) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9A9AA4' }}>Dívida não encontrada</p>
      </div>
    )
  }

  const group = groups.find((g) => g.id === debt.groupId)
  const creditor = group?.members.find((m) => m.userId === debt.paidByUserId)?.user
  const creditorName = creditor?.id === currentUser?.id ? 'Você' : (creditor?.name ?? '—')
  const splitLabel = debt.splitType === 'equal' ? 'Igualitária' : 'Personalizada'

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Coral header */}
      <div style={{ background: 'linear-gradient(150deg,#FF5436,#FF8A3D)', padding: '52px 20px 26px', color: '#fff' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontWeight: 700, fontSize: 14, color: '#fff', background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: 16, opacity: .95,
          }}
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M7.5 1L1.5 7.5l6 6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>

        <div style={{ fontSize: 13, opacity: .9, fontWeight: 600 }}>{group?.name}</div>
        <div style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800, fontSize: 26, margin: '3px 0 14px', letterSpacing: '-.01em',
        }}>
          {debt.description}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: .85 }}>Valor total</div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>{formatCurrency(debt.totalAmount)}</div>
          </div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,.3)' }} />
          <div>
            <div style={{ fontSize: 11, opacity: .85 }}>Quem pagou</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{creditorName}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              background: 'rgba(255,255,255,.2)',
              padding: '5px 11px', borderRadius: 999,
              fontSize: 11, fontWeight: 800,
            }}>
              {splitLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Installments */}
      <div style={{ padding: '18px 20px 120px' }}>
        <div style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700, fontSize: 15, color: '#15151A', marginBottom: 12,
        }}>
          Parcelas por devedor
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {debt.installments.map((inst, idx) => (
            <InstallmentCard
              key={inst.id}
              installment={inst}
              creditorId={debt.paidByUserId}
              creditorName={creditorName}
              debtDescription={debt.description}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Avatar palette ─────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: '#FFF0ED', fg: '#FF5436' },
  { bg: '#EDF4FF', fg: '#2563EB' },
  { bg: '#E9F9F0', fg: '#0E8F5C' },
  { bg: '#FFF8EE', fg: '#B57400' },
  { bg: '#F0EDFF', fg: '#7C3AED' },
  { bg: '#FFF0F8', fg: '#DB2777' },
]

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending: { label: 'Pendente', color: '#FF5436', sub: 'Aguardando pagamento' },
  awaiting_confirmation: { label: 'Aguardando', color: '#B57400', sub: 'Comprovante enviado' },
  paid: { label: 'Pago', color: '#0E8F5C', sub: 'Quitado' },
} as const

// ── InstallmentCard ────────────────────────────────────────────────────────────
interface CardProps {
  installment: Installment
  creditorId: string
  creditorName: string
  debtDescription: string
  index: number
}

function InstallmentCard({ installment, creditorId, creditorName, index }: CardProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const { generateChargeLink, updateInstallmentStatus } = useAppStore()

  const isCreditor = currentUser?.id === creditorId
  const isOwn = currentUser?.id === installment.debtorUserId
  const { status } = installment
  const av = AVATAR_PALETTE[index % AVATAR_PALETTE.length]
  const st = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending

  const handleCharge = () => {
    const link = generateChargeLink(installment.id)
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copiado!\n\n${link}`)
    })
  }

  const showCobrar = isCreditor && status === 'pending' && !isOwn
  const showReview = isCreditor && status === 'awaiting_confirmation'
  const showWaiting = !isCreditor && isOwn && status === 'awaiting_confirmation'
  const showPaid = status === 'paid'

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 15,
      boxShadow: '0 2px 10px rgba(0,0,0,.04)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: av.bg, color: av.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13,
        }}>
          {getInitials(installment.debtor.name)}
        </div>

        {/* Name + sub */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1F' }}>
            {installment.debtor.name}
          </div>
          <div style={{ fontSize: 11.5, color: '#9A9AA4', marginTop: 1 }}>
            {st.sub}
          </div>
        </div>

        {/* Amount + status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#15151A' }}>
            {formatCurrency(installment.amount)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: st.color, marginTop: 1 }}>
            {st.label}
          </div>
        </div>
      </div>

      {/* Cobrar no WhatsApp */}
      {showCobrar && (
        <button
          onClick={handleCharge}
          style={{
            marginTop: 13, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#E9F9F0', color: '#0E8F5C',
            fontWeight: 800, fontSize: 14, padding: 12,
            borderRadius: 13, cursor: 'pointer', border: 'none',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#0E8F5C">
            <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm5.5 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.8c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2z"/>
          </svg>
          Cobrar no WhatsApp
        </button>
      )}

      {/* Comprovante review (creditor) */}
      {showReview && (
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
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🧾</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1A1A1F' }}>comprovante_pix.jpg</div>
              <div style={{ fontSize: 11, color: '#A88A4E' }}>Enviado por {installment.debtor.name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => updateInstallmentStatus(installment.id, 'pending')}
              style={{
                flex: 1, textAlign: 'center', padding: 11,
                borderRadius: 12, fontWeight: 800, fontSize: 13.5,
                background: '#FFEDE8', color: '#E0431F',
                border: 'none', cursor: 'pointer',
              }}
            >
              Rejeitar
            </button>
            <button
              onClick={() => updateInstallmentStatus(installment.id, 'paid')}
              style={{
                flex: 2, textAlign: 'center', padding: 11,
                borderRadius: 12, fontWeight: 800, fontSize: 13.5,
                background: '#11A36B', color: '#fff',
                border: 'none', cursor: 'pointer',
              }}
            >
              Confirmar recebimento
            </button>
          </div>
        </div>
      )}

      {/* Waiting (debtor) */}
      {showWaiting && (
        <div style={{
          marginTop: 13, textAlign: 'center',
          background: '#FFF8EE', color: '#A88A4E',
          fontWeight: 700, fontSize: 12.5,
          padding: 10, borderRadius: 12,
        }}>
          ⏳ Comprovante enviado · aguardando {creditorName} confirmar
        </div>
      )}

      {/* Paid */}
      {showPaid && (
        <div style={{
          marginTop: 13, textAlign: 'center',
          background: '#E9F9F0', color: '#0E8F5C',
          fontWeight: 700, fontSize: 12.5,
          padding: 10, borderRadius: 12,
        }}>
          ✓ Pagamento confirmado
        </div>
      )}
    </div>
  )
}
