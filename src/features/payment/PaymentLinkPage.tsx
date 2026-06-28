import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { formatCurrency, formatDate } from '../../lib/utils'
import ProofUpload from './components/ProofUpload'
import QuickRegisterForm from './components/QuickRegisterForm'
import StatusBadge from '../debts/components/StatusBadge'
import { Button } from '../../components/ui/button'

export default function PaymentLinkPage() {
  const { token } = useParams<{ token: string }>()
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
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg,#FF5436,#FF9A3D)', fontFamily: '"Bricolage Grotesque"' }}
        >
          R
        </div>
        <p className="font-heading text-xl font-bold text-[#15151A]">Link inválido ou expirado</p>
        <p className="mt-2 text-sm text-muted">Este link de cobrança não existe ou já expirou.</p>
      </div>
    )
  }

  const isExpired = new Date(installment.chargeLink!.expiresAt) < new Date()

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
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F7F0] text-3xl mb-4">✓</div>
        <p className="font-heading text-xl font-bold text-[#15151A]">Comprovante enviado!</p>
        <p className="mt-2 text-sm text-muted max-w-xs">
          Aguardando confirmação de quem pagou. Você será notificado quando confirmado.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface pb-10">
      <div
        className="px-5 pt-14 pb-6 text-white"
        style={{ background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)' }}
      >
        <div
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl font-extrabold text-white"
          style={{ background: 'rgba(255,255,255,0.2)', fontFamily: '"Bricolage Grotesque"' }}
        >
          R
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Você tem uma cobrança</h1>
        <p className="mt-1 text-sm text-white/80">Rachei · Link de pagamento</p>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs text-muted">Referente a</p>
          <p className="mt-1 font-heading text-lg font-extrabold text-[#15151A]">{debt.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Sua parte</p>
              <p className="font-heading text-2xl font-extrabold text-brand">{formatCurrency(installment.amountCents)}</p>
            </div>
            <StatusBadge status={installment.status} />
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted">Criado em {formatDate(debt.createdAt)}</p>
            {isExpired && <span className="text-xs font-semibold text-negative">Link expirado</span>}
          </div>
        </div>

        {!isExpired && installment.status === 'pending' && (
          <>
            <ProofUpload onUpload={setProofFile} />
            {showRegister ? (
              <QuickRegisterForm onComplete={doConfirm} />
            ) : (
              <Button
                disabled={!proofFile}
                onClick={handleConfirmPayment}
                className="w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float disabled:opacity-50"
              >
                Marcar como pago
              </Button>
            )}
          </>
        )}

        {installment.status === 'awaiting_confirmation' && (
          <div className="rounded-2xl bg-yellow-50 p-4 text-center">
            <p className="text-sm font-semibold text-yellow-700">Comprovante enviado. Aguardando confirmação.</p>
          </div>
        )}

        {installment.status === 'paid' && (
          <div className="rounded-2xl bg-[#E8F7F0] p-4 text-center">
            <p className="text-sm font-semibold text-positive">Pagamento confirmado! ✓</p>
          </div>
        )}
      </div>
    </div>
  )
}
