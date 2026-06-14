import { formatCurrency } from '../../../lib/utils'

interface BalanceCardProps {
  totalBalance: number
  totalOwed: number
  totalOwing: number
}

export default function BalanceCard({ totalBalance, totalOwed, totalOwing }: BalanceCardProps) {
  const isPositive = totalBalance >= 0

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-hero"
      style={{ background: 'linear-gradient(140deg,#FF5436 0%,#FF8A3D 100%)' }}
    >
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
      <p className="text-xs font-semibold opacity-90 tracking-wide">Saldo geral consolidado</p>
      <p className="mt-1.5 font-heading text-4xl font-extrabold tracking-tight">
        {isPositive ? '+' : ''}{formatCurrency(totalBalance)}
      </p>
      <p className="mt-1 text-xs opacity-90">
        {isPositive ? 'Te devem mais do que você deve 🎉' : 'Você deve mais do que te devem'}
      </p>
      <div className="mt-5 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white/20 px-3 py-2.5 backdrop-blur-sm">
          <p className="text-[10px] font-semibold opacity-85">↗ Te devem</p>
          <p className="mt-1 text-sm font-extrabold">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-black/15 px-3 py-2.5">
          <p className="text-[10px] font-semibold opacity-85">↙ Você deve</p>
          <p className="mt-1 text-sm font-extrabold">{formatCurrency(totalOwing)}</p>
        </div>
      </div>
    </div>
  )
}
