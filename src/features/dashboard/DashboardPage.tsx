import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { getInitials } from '../../lib/utils'
import type { FriendBalance } from '../../types'
import BalanceCard from './components/BalanceCard'
import FriendRow from './components/FriendRow'
import GroupCard from './components/GroupCard'
import { Button } from '../../components/ui/button'

export default function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const { groups, debts } = useAppStore()

  const { totalOwed, totalOwing, friendBalances } = useMemo(() => {
    if (!currentUser) return { totalOwed: 0, totalOwing: 0, friendBalances: [] as FriendBalance[] }

    const balanceMap = new Map<string, number>()

    for (const debt of debts) {
      for (const inst of debt.installments) {
        if (inst.status === 'paid') continue
        if (debt.paidByUserId === currentUser.id && inst.debtorUserId !== currentUser.id) {
          balanceMap.set(inst.debtorUserId, (balanceMap.get(inst.debtorUserId) ?? 0) + inst.amount)
        }
        if (inst.debtorUserId === currentUser.id && debt.paidByUserId !== currentUser.id) {
          balanceMap.set(debt.paidByUserId, (balanceMap.get(debt.paidByUserId) ?? 0) - inst.amount)
        }
      }
    }

    let totalOwed = 0
    let totalOwing = 0
    const friendBalances: FriendBalance[] = []

    for (const [userId, balance] of balanceMap.entries()) {
      const allUsers = groups.flatMap((g) => g.members.map((m) => m.user))
      const user = allUsers.find((u) => u.id === userId)
      if (!user) continue
      if (balance > 0) totalOwed += balance
      else totalOwing += Math.abs(balance)
      friendBalances.push({ user, balance })
    }

    return { totalOwed, totalOwing, friendBalances: friendBalances.sort((a, b) => b.balance - a.balance) }
  }, [currentUser, debts, groups])

  const getPendingCount = (groupId: string) =>
    debts
      .filter((d) => d.groupId === groupId)
      .flatMap((d) => d.installments)
      .filter((i) => i.status !== 'paid').length

  if (!currentUser) return null

  return (
    <div className="no-scrollbar min-h-dvh overflow-auto bg-surface pb-10">
      <div className="flex items-center justify-between px-5 pb-2 pt-14">
        <div>
          <p className="text-sm font-semibold text-muted">Olá, {currentUser.name.split(' ')[0]} 👋</p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-[#15151A]">
            Seu saldo
          </h1>
        </div>
        <button
          onClick={() => navigate('/perfil')}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white font-bold text-sm text-white shadow-[0_2px_8px_rgba(255,90,60,.3)]"
          style={{ background: 'linear-gradient(135deg,#FFB199,#FF7A59)' }}
          aria-label="Ver perfil"
        >
          {getInitials(currentUser.name)}
        </button>
      </div>

      <div className="px-5 mt-2">
        <BalanceCard
          totalBalance={totalOwed - totalOwing}
          totalOwed={totalOwed}
          totalOwing={totalOwing}
        />
      </div>

      {friendBalances.length > 0 && (
        <div className="px-5 mt-6">
          <h2 className="font-heading text-base font-bold text-[#15151A] mb-3">Por amigo</h2>
          <div className="rounded-3xl bg-white shadow-card">
            {friendBalances.map((fb, i) => (
              <FriendRow key={fb.user.id} friendBalance={fb} isLast={i === friendBalances.length - 1} />
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-6">
        <h2 className="font-heading text-base font-bold text-[#15151A] mb-3">Seus grupos</h2>
        <div className="flex flex-col gap-2.5">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} pendingCount={getPendingCount(group.id)} />
          ))}
        </div>
        <Button
          className="mt-4 w-full rounded-2xl border-2 border-dashed border-border bg-transparent font-semibold text-muted shadow-none hover:bg-white"
          variant="outline"
          onClick={() => {}}
        >
          + Criar novo grupo
        </Button>
      </div>

      <div className="px-5 mt-8">
        <Button variant="ghost" className="w-full text-muted text-xs" onClick={logout}>
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
