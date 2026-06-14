import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/app.store'
import GroupHeader from './components/GroupHeader'
import MemberList from './components/MemberList'
import DebtList from './components/DebtList'

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
    <div className="min-h-dvh bg-surface pb-28">
      <GroupHeader group={group} />
      <MemberList group={group} />
      <DebtList debts={debts} />

      <div className="px-5 mt-4">
        <button
          onClick={() => navigate(`/grupos/${group.id}/nova-divida`)}
          className="w-full rounded-2xl py-4 font-extrabold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#FF5436,#FF8A3D)', boxShadow: '0 8px 18px rgba(255,84,54,.28)' }}
          type="button"
        >
          + Registrar dívida
        </button>
      </div>
    </div>
  )
}
