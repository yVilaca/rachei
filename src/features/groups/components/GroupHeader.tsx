import { useNavigate } from 'react-router-dom'
import type { Group } from '../../../types'

interface GroupHeaderProps {
  group: Group
}

export default function GroupHeader({ group }: GroupHeaderProps) {
  const navigate = useNavigate()

  return (
    <div
      className="px-5 pt-14 pb-6 text-white"
      style={{ background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)' }}
    >
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-white/80"
        aria-label="Voltar"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Voltar
      </button>
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">{group.name}</h1>
      <p className="mt-1 text-sm text-white/80">{group.members.length} membros</p>
    </div>
  )
}
