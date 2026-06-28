import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import ProofUpload from './components/ProofUpload'
import QuickRegisterForm from './components/QuickRegisterForm'

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { debts, updateInstallmentStatus } = useAppStore()
  const [showRegister, setShowRegister] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const installment = debts
    .flatMap((d) => d.installments)
    .find((i) => i.chargeLink?.token === token)

  const debt = debts.find((d) => d.installments.some((i) => i.chargeLink?.token === token))

  if (!installment || !debt) {
    return (
      <div style={{
        display: 'flex', minHeight: '100dvh', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', textAlign: 'center',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, marginBottom: 16,
          background: 'linear-gradient(135deg,#FF5436,#FF9A3D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 28, color: '#fff',
        }}>
          R
        </div>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 22, color: '#15151A' }}>
          Link inválido ou expirado
        </div>
        <div style={{ fontSize: 13.5, color: '#6B6B76', marginTop: 8 }}>
          Este link de cobrança não existe ou já expirou.
        </div>
      </div>
    )
  }

  const isExpired = new Date(installment.chargeLink!.expiresAt) < new Date()
  const { status } = installment
  const isPending = status === 'pending'
  const isAwaiting = status === 'awaiting_confirmation'
  const isPaid = status === 'paid'

  const creditor = debt.installments.find((i) => i.debtorUserId !== debt.paidByUserId)
  const creditorAvatar = avatarFor(debt.paidByUserId)

  const doConfirm = () => {
    if (!proofFile) return
    updateInstallmentStatus(installment.id, 'awaiting_confirmation', URL.createObjectURL(proofFile))
    setSubmitted(true)
  }

  const handleConfirmPayment = () => {
    if (!proofFile) return
    if (!isAuthenticated) {
      setShowRegister(true)
      return
    }
    doConfirm()
  }

  if (submitted) {
    return (
      <div style={{
        display: 'flex', minHeight: '100dvh', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', textAlign: 'center',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#E9F9F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, marginBottom: 16,
        }}>✓</div>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 22, color: '#0E8F5C' }}>
          Comprovante enviado!
        </div>
        <div style={{ fontSize: 13.5, color: '#6B6B76', marginTop: 8, maxWidth: 280, lineHeight: 1.5 }}>
          Aguardando confirmação de quem pagou. Você será notificado quando confirmado.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F5F5F8', paddingBottom: 40,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    }}>
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 14, color: '#fff',
          }}>R</div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6B6B76' }}>Rachei · Link seguro</span>
        </div>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 20, color: '#15151A', letterSpacing: '-.01em' }}>
          {debt.description}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Hero: valor */}
        <div style={{
          background: isPaid ? '#E9F9F0' : '#fff',
          borderRadius: 22, padding: '20px 20px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,.06)',
          border: isPaid ? '1.5px solid #BEE9D2' : isAwaiting ? '1.5px solid #FCE6C0' : '1.5px solid #FFE0D2',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, color: '#6B6B76', fontWeight: 600, marginBottom: 6 }}>
            {isPaid ? 'Você pagou' : 'Sua parte'}
          </div>
          <div style={{
            fontFamily: '"Bricolage Grotesque"', fontWeight: 800,
            fontSize: 42, letterSpacing: '-.02em',
            color: isPaid ? '#0E8F5C' : '#FF5436',
            lineHeight: 1.05, marginBottom: 16,
          }}>
            {formatCurrency(installment.amountCents)}
          </div>

          {/* Credor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: creditorAvatar.bg, color: creditorAvatar.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {getInitials(creditor?.debtor.name ?? debt.paidByUserId)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B76', fontWeight: 600 }}>Cobrado por</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1A1F' }}>
                {debt.installments.find((i) => i.debtorUserId !== debt.paidByUserId)?.debtor.name ?? debt.paidByUserId}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                background: isPaid ? '#E9F9F0' : isAwaiting ? '#FFF8EE' : '#FFF0ED',
                color: isPaid ? '#0E8F5C' : isAwaiting ? '#B57400' : '#FF5436',
                fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
              }}>
                {isPaid ? 'Pago' : isAwaiting ? 'Aguardando' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes da dívida */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: 18,
          boxShadow: '0 2px 10px rgba(0,0,0,.04)', marginBottom: 14,
        }}>
          <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 14, color: '#15151A', marginBottom: 14 }}>
            Detalhes
          </div>
          {([
            ['Criado em', formatDate(debt.createdAt)],
            ['Total da despesa', formatCurrency(debt.totalAmountCents)],
            ['Sua parte', formatCurrency(installment.amountCents)],
            ...(isExpired ? [['Status do link', 'Expirado']] : []),
          ] as [string, string][]).map(([label, value], i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: i < arr.length - 1 ? 11 : 0,
              marginBottom: i < arr.length - 1 ? 11 : 0,
              borderBottom: i < arr.length - 1 ? '1px solid #F0F0F4' : 'none',
            }}>
              <span style={{ fontSize: 13.5, color: '#6B6B76' }}>{label}</span>
              <span style={{
                fontSize: 13.5, fontWeight: 700,
                color: label === 'Status do link' ? '#E0431F' : '#1A1A1F',
              }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Upload + CTA */}
        {!isExpired && isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#6B6B76', letterSpacing: '.05em', marginBottom: 12 }}>
                ANEXAR COMPROVANTE
              </div>
              <ProofUpload onUpload={setProofFile} />
            </div>

            {showRegister ? (
              <QuickRegisterForm onComplete={doConfirm} />
            ) : (
              <button
                disabled={!proofFile}
                onClick={handleConfirmPayment}
                style={{
                  width: '100%', padding: 16, borderRadius: 16,
                  fontWeight: 800, fontSize: 16, border: 'none',
                  cursor: proofFile ? 'pointer' : 'not-allowed',
                  background: proofFile ? 'linear-gradient(135deg,#FF5436,#FF8A3D)' : '#EBEBEF',
                  color: proofFile ? '#fff' : '#6B6B76',
                  boxShadow: proofFile ? '0 8px 18px rgba(255,84,54,.3)' : 'none',
                  transition: 'background .2s, box-shadow .2s',
                }}
              >
                Marcar como pago
              </button>
            )}

            <div style={{ textAlign: 'center', fontSize: 11.5, color: '#6B6B76', lineHeight: 1.5 }}>
              Confirmação dupla: quem cobrou revisa o comprovante antes de quitar a dívida.
            </div>
          </div>
        )}

        {isAwaiting && (
          <div style={{
            background: '#FFF8EE', border: '1px solid #FCE6C0',
            borderRadius: 16, padding: '16px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1F' }}>Comprovante enviado</div>
              <div style={{ fontSize: 12.5, color: '#A88A4E', marginTop: 3 }}>
                Aguardando confirmação. Você será notificado assim que confirmado.
              </div>
            </div>
          </div>
        )}

        {isPaid && (
          <div style={{
            background: '#E9F9F0', border: '1px solid #BEE9D2',
            borderRadius: 16, padding: '16px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0E8F5C' }}>Pagamento confirmado!</div>
              <div style={{ fontSize: 12.5, color: '#3BA877', marginTop: 3 }}>
                Sua dívida está quitada.
              </div>
            </div>
          </div>
        )}

        {isExpired && isPending && (
          <div style={{
            background: '#FFF0ED', border: '1px solid #FFD6CC',
            borderRadius: 16, padding: '16px 18px', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#E0431F' }}>Link expirado</div>
            <div style={{ fontSize: 12.5, color: '#B05040', marginTop: 3 }}>
              Solicite um novo link de cobrança ao credor.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
