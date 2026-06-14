import { formatCurrency, getInitials } from '../../../lib/utils'
import type { FriendBalance } from '../../../types'

interface FriendRowProps {
  friendBalance: FriendBalance
  isLast: boolean
}

export default function FriendRow({ friendBalance, isLast }: FriendRowProps) {
  const { user, balance } = friendBalance
  const isPositive = balance > 0

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isPositive ? 'bg-[#E8F7F0] text-positive' : 'bg-brand-100 text-brand'
          }`}
        >
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-[#1A1A1F]">{user.name}</p>
          <p className="text-xs text-muted">{isPositive ? 'te deve' : 'você deve'}</p>
        </div>
        <p className={`text-sm font-extrabold ${isPositive ? 'text-positive' : 'text-brand'}`}>
          {isPositive ? '+' : '−'}{formatCurrency(Math.abs(balance))}
        </p>
      </div>
      {!isLast && <div className="mx-4 h-px bg-[#F0F0F3]" />}
    </>
  )
}
