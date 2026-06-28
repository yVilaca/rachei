import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import GroupHeader from './components/GroupHeader'
import DebtList from './components/DebtList'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { groups, getDebtsByGroup } = useAppStore()

  const group = groups.find((g) => g.id === id)
  if (!group) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center">
        <p className="text-muted">Grupo não encontrado</p>
      </div>
    )
  }

  const debts = getDebtsByGroup(group.id)

  const groupBalance = useMemo(() => {
    if (!currentUser) return 0
    let net = 0
    for (const debt of debts) {
      for (const inst of debt.installments) {
        if (inst.status === 'paid') continue
        if (debt.paidByUserId === currentUser.id && inst.debtorUserId !== currentUser.id) {
          net += inst.amountCents
        }
        if (inst.debtorUserId === currentUser.id && debt.paidByUserId !== currentUser.id) {
          net -= inst.amountCents
        }
      }
    }
    return net
  }, [currentUser, debts])

  return (
    <div className="no-scrollbar min-h-dvh overflow-auto bg-[#F5F5F8] pb-28">
      <GroupHeader group={group} groupBalance={groupBalance} />
      <DebtList debts={debts} group={group} />

      <div className="px-5 mt-4">
        <button
          onClick={() => navigate(`/grupos/${group.id}/nova-divida`)}
          style={{
            width: '100%', padding: '15px', borderRadius: 16,
            background: 'linear-gradient(135deg,#FF5436,#FF8A3D)',
            color: '#fff', fontWeight: 800, fontSize: 15.5,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(255,84,54,.28)',
          }}
        >
          + Registrar dívida
        </button>
      </div>
    </div>
  )
}
