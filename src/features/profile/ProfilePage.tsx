import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { formatCurrency, getInitials } from '../../lib/utils'
import { Button } from '../../components/ui/button'

const SETTINGS_ITEMS = [
  { label: 'Notificações', icon: '🔔' },
  { label: 'Privacidade', icon: '🔒' },
  { label: 'Ajuda & Suporte', icon: '💬' },
  { label: 'Termos de uso', icon: '📄' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser: user, logout } = useAuthStore()
  const { debts } = useAppStore()

  const stats = useMemo(() => {
    if (!user) return { totalDebts: 0, totalPaid: 0, totalPending: 0 }
    const all = debts.flatMap((d) => d.installments).filter((i) => i.debtorUserId === user.id)
    const paid = all.filter((i) => i.status === 'paid')
    return {
      totalDebts: all.length,
      totalPaid: paid.reduce((acc, i) => acc + i.amount, 0),
      totalPending: all.filter((i) => i.status === 'pending').reduce((acc, i) => acc + i.amount, 0),
    }
  }, [debts, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-dvh bg-surface pb-28">
      <div
        className="px-5 pt-14 pb-8 text-white"
        style={{ background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 font-heading text-xl font-extrabold text-white">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="font-heading text-xl font-extrabold">{user.name}</p>
            <p className="text-sm text-white/80">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              {user.plan}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cobranças', value: stats.totalDebts.toString() },
            { label: 'Pago', value: formatCurrency(stats.totalPaid) },
            { label: 'Pendente', value: formatCurrency(stats.totalPending) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-card text-center">
              <p className="font-heading text-lg font-extrabold text-[#15151A]">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {user.plan === 'free' && (
          <div
            className="rounded-3xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg,#FF5436,#FF8A3D)' }}
          >
            <p className="font-heading text-base font-extrabold">Upgrade para Pro</p>
            <p className="mt-1 text-sm text-white/80">Grupos ilimitados, lembretes automáticos e muito mais.</p>
            <Button className="mt-3 rounded-xl bg-white font-bold text-brand hover:bg-white/90">
              Ver planos
            </Button>
          </div>
        )}

        <div className="rounded-3xl bg-white shadow-card overflow-hidden">
          {SETTINGS_ITEMS.map((item, idx) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-[#15151A] hover:bg-surface transition-colors ${idx < SETTINGS_ITEMS.length - 1 ? 'border-b border-border' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              <span className="ml-auto text-muted">›</span>
            </button>
          ))}
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-2xl border-2 border-brand font-bold text-brand hover:bg-brand/5"
        >
          Sair da conta
        </Button>

        <p className="text-center text-xs text-muted">Rachei v1.0.0 · Feito com ♥ no Brasil</p>
      </div>
    </div>
  )
}
