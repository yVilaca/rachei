import { useNavigate } from 'react-router-dom'
import type { Group } from '../../../types'

interface GroupCardProps {
  group: Group
  pendingCount: number
}

export default function GroupCard({ group, pendingCount }: GroupCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/grupos/${group.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card text-left"
    >
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
        style={{ background: 'linear-gradient(135deg,#FF5436,#FF8A3D)' }}
      >
        {group.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-[#1A1A1F]">{group.name}</p>
        <p className="text-xs text-muted">{group.members.length} membros</p>
      </div>
      {pendingCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
          {pendingCount}
        </span>
      )}
    </button>
  )
}
