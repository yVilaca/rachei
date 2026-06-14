import { getInitials } from '../../../lib/utils'
import type { Group } from '../../../types'

interface MemberListProps {
  group: Group
}

export default function MemberList({ group }: MemberListProps) {
  return (
    <div className="px-5 mt-4">
      <h2 className="font-heading text-sm font-bold text-[#15151A] mb-2">Membros</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {group.members.map((member) => (
          <div key={member.userId} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand">
              {getInitials(member.user.name)}
            </div>
            <p className="text-[11px] text-muted max-w-[48px] truncate text-center">
              {member.user.name.split(' ')[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
