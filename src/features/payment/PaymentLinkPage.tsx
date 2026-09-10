import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatCurrency, getInitials } from '../../lib/utils'
import { avatarFor } from '../../lib/avatar'
import { paymentService, type PublicCharge } from '../../services/payment.service'

function CenteredCard({ emoji, title, subtitle, tone = '#FF5436' }: { emoji: string; title: string; subtitle: string; tone?: string }) {
  return (
    <div style={{
      display: 'flex', minHeight: '100dvh', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', textAlign: 'center', fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 16,
        background: tone, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, color: '#fff',
      }}>{emoji}</div>
      <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 22, color: '#15151A' }}>{title}</div>
      <div style={{ fontSize: 13.5, color: '#6B6B76', marginTop: 8, maxWidth: 300, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  )
}

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [charge, setCharge] = useState<PublicCharge | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    paymentService.getCharge(token)
      .then((c) => { if (!cancelled) { setCharge(c); setLoading(false) } })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return <CenteredCard emoji="R" title="Carregando..." subtitle="Buscando os dados da cobrança." />
  }

  if (notFound || !charge) {
    return (
      <CenteredCard
        emoji="R"
        title="Link inválido ou expirado"
        subtitle="Este link de cobrança não existe ou já expirou."
      />
    )
  }

  const isPaid = charge.status === 'paid'
  const isAwaiting = charge.status === 'awaiting_confirmation'
  const isPending = charge.status === 'pending'
  const av = avatarFor(charge.creditorName)

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F8', paddingBottom: 40, fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '52px 20px 18px', borderBottom: '1px solid #EEEEF2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, color: '#fff',
          }}>R</div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6B6B76' }}>Rachei · Link seguro</span>
        </div>
        <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, color: '#15151A', letterSpacing: '-.01em' }}>
          {charge.description}
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
            {isPaid ? 'Pago' : 'Sua parte'}
          </div>
          <div style={{
            fontFamily: 'Poppins', fontWeight: 800,
            fontSize: 42, letterSpacing: '-.02em',
            color: isPaid ? '#0E8F5C' : '#FF5436',
            lineHeight: 1.05, marginBottom: 16,
          }}>
            {formatCurrency(charge.amountCents)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: av.bg, color: av.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {getInitials(charge.creditorName)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B76', fontWeight: 600 }}>Cobrado por</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1A1A1F' }}>{charge.creditorName}</div>
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

        {/* Ação: confirmar pagamento acontece dentro do app autenticado */}
        {isPending && !charge.expired && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: '#fff', borderRadius: 18, padding: 18,
              boxShadow: '0 2px 10px rgba(0,0,0,.04)',
              fontSize: 13.5, color: '#3A3A42', lineHeight: 1.5,
            }}>
              Para confirmar que já pagou, abra o Rachei e declare o pagamento na sua
              lista de dívidas. Quem cobrou revisa o comprovante antes de quitar (confirmação dupla).
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', padding: 16, borderRadius: 16,
                fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', color: '#fff',
                boxShadow: '0 8px 18px rgba(255,84,54,.3)',
              }}
            >
              Abrir o Rachei para pagar
            </button>
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
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A1F' }}>Pagamento em análise</div>
              <div style={{ fontSize: 12.5, color: '#A88A4E', marginTop: 3 }}>
                Aguardando {charge.creditorName} confirmar o recebimento.
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
              <div style={{ fontSize: 12.5, color: '#3BA877', marginTop: 3 }}>Esta dívida está quitada.</div>
            </div>
          </div>
        )}

        {charge.expired && isPending && (
          <div style={{
            background: '#FFF0ED', border: '1px solid #FFD6CC',
            borderRadius: 16, padding: '16px 18px', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#E0431F' }}>Link expirado</div>
            <div style={{ fontSize: 12.5, color: '#B05040', marginTop: 3 }}>
              Solicite um novo link de cobrança a quem te cobrou.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
