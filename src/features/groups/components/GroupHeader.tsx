import { useNavigate } from 'react-router-dom'
import type { Group } from '../../../types'

interface GroupHeaderProps {
  group: Group
}

export default function GroupHeader({ group }: GroupHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="px-5 pt-14 pb-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-bold text-muted"
        aria-label="Voltar"
      >
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
          <path d="M7.5 1L1.5 7.5l6 6.5" stroke="#6B6B76" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Voltar
      </button>
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-[54px] w-[54px] flex-shrink-0 items-center justify-center rounded-[16px] text-[26px]"
          style={{ background: '#FFF0ED' }}
        >
          {group.emoji ?? group.name[0]}
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-[22px] font-extrabold tracking-tight text-[#15151A]">
            {group.name}
          </h1>
          <p className="text-xs text-muted">{group.members.length} membros</p>
        </div>
      </div>
    </div>
  )
}
