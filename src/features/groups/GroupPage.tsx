import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/app.store'
import GroupHeader from './components/GroupHeader'
import MemberList from './components/MemberList'
import DebtList from './components/DebtList'
import { Button } from '../../components/ui/button'

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <GroupHeader group={group} />
      <MemberList group={group} />
      <DebtList debts={debts} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 w-full max-w-md">
        <Button
          className="w-full rounded-2xl bg-gradient-to-r from-brand to-brand-light py-4 font-extrabold text-white shadow-float"
          onClick={() => navigate(`/grupos/${group.id}/nova-divida`)}
        >
          + Registrar dívida
        </Button>
      </div>
    </div>
  )
}
