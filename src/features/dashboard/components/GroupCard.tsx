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
      className="flex w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 shadow-card text-left"
    >
      <div
        className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px] text-2xl"
        style={{ background: '#FFF0ED' }}
      >
        {group.emoji ?? group.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[15px] font-bold text-[#1A1A1F]">{group.name}</p>
        <p className="text-xs text-muted">{group.members.length} membros</p>
      </div>
      {pendingCount > 0 && (
        <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
          {pendingCount}
        </span>
      )}
    </button>
  )
}
