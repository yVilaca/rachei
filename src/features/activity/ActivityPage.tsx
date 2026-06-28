import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore } from '../../stores/app.store'
import { formatCurrency } from '../../lib/utils'

// ── Event types ────────────────────────────────────────────────────────────────

type EventType =
  | 'proof_received'      // alguém enviou comprovante, sou credor → ação necessária
  | 'payment_confirmed'   // pagamento confirmado
  | 'debt_created_me'     // eu criei a dívida
  | 'debt_added'          // fui adicionado à dívida
  | 'pending_reminder'    // tenho parcela pendente
  | 'charged'             // recebi link de cobrança

interface ActivityEvent {
  id: string
  type: EventType
  title: string
  sub: string
  date: string // ISO
  actionable: boolean
  debtId?: string
  installmentId?: string
}

const EVENT_STYLE: Record<EventType, { icon: string; bg: string; color: string }> = {
  proof_received:     { icon: '📎', bg: '#FFF4EF', color: '#E86A2E' },
  payment_confirmed:  { icon: '✅', bg: '#E9F9F0', color: '#0E8F5C' },
  debt_created_me:    { icon: '💸', bg: '#EEF2FF', color: '#4B6FE5' },
  debt_added:         { icon: '🔔', bg: '#FFF0ED', color: '#FF5436' },
  pending_reminder:   { icon: '⏳', bg: '#FFF8EE', color: '#B57400' },
  charged:            { icon: '📩', bg: '#F0EDFF', color: '#7C3AED' },
}

// ── Date helpers ───────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-28T12:00:00Z')

function relativeDate(iso: string): string {
  const d = new Date(iso)
  const diffMs = NOW.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'agora há pouco'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffH < 24) return `há ${diffH}h`
  if (diffD === 1) return 'ontem'
  if (diffD < 7) return `há ${diffD} dias`
  return `há ${diffD} dias`
}

function dateGroup(iso: string): string {
  const d = new Date(iso)
  const diffD = Math.floor((NOW.getTime() - d.getTime()) / 86400000)
  if (diffD === 0) return 'Hoje'
  if (diffD === 1) return 'Ontem'
  if (diffD < 7) return 'Esta semana'
  return 'Mais antigo'
}

const GROUP_ORDER = ['Hoje', 'Ontem', 'Esta semana', 'Mais antigo']

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { debts, groups, readEventIds, markEventRead, markAllEventsRead } = useAppStore()
  const [tab, setTab] = useState<'all' | 'action'>('all')

  const events = useMemo<ActivityEvent[]>(() => {
    if (!currentUser) return []

    const list: ActivityEvent[] = []
    const allMembers = groups.flatMap((g) => g.members)

    const groupName = (groupId: string) =>
      groups.find((g) => g.id === groupId)?.name ?? ''

    for (const debt of debts) {
      const isCreditor = debt.paidByUserId === currentUser.id
      const gName = groupName(debt.groupId)
      const creditorUser = allMembers.find((m) => m.userId === debt.paidByUserId)?.user

      // Debt created event
      if (isCreditor) {
        list.push({
          id: `ev-created-${debt.id}`,
          type: 'debt_created_me',
          title: `Você registrou "${debt.description}"`,
          sub: `${gName} · ${formatCurrency(debt.totalAmount)} · ${relativeDate(debt.createdAt)}`,
          date: debt.createdAt,
          actionable: false,
          debtId: debt.id,
        })
      } else {
        const isDebtor = debt.installments.some((i) => i.debtorUserId === currentUser.id)
        if (isDebtor) {
          list.push({
            id: `ev-added-${debt.id}`,
            type: 'debt_added',
            title: `${creditorUser?.name ?? 'Alguém'} adicionou você a "${debt.description}"`,
            sub: `${gName} · ${relativeDate(debt.createdAt)}`,
            date: debt.createdAt,
            actionable: false,
            debtId: debt.id,
          })
        }
      }

      // Per-installment events
      for (const inst of debt.installments) {
        const isMyInst = inst.debtorUserId === currentUser.id

        if (inst.status === 'awaiting_confirmation' && isCreditor) {
          list.push({
            id: `ev-proof-${inst.id}`,
            type: 'proof_received',
            title: `${inst.debtor.name} enviou um comprovante`,
            sub: `${debt.description} · ${gName} · aguardando sua confirmação`,
            date: inst.paidAt ?? debt.createdAt,
            actionable: true,
            debtId: debt.id,
            installmentId: inst.id,
          })
        }

        if (inst.status === 'paid' && inst.confirmedAt) {
          if (isCreditor && inst.debtorUserId !== currentUser.id) {
            list.push({
              id: `ev-paid-${inst.id}`,
              type: 'payment_confirmed',
              title: `Pagamento de ${inst.debtor.name} confirmado`,
              sub: `${debt.description} · ${gName} · ${formatCurrency(inst.amount)} · ${relativeDate(inst.confirmedAt)}`,
              date: inst.confirmedAt,
              actionable: false,
              debtId: debt.id,
            })
          }
          if (isMyInst && !isCreditor) {
            list.push({
              id: `ev-mypaid-${inst.id}`,
              type: 'payment_confirmed',
              title: `${creditorUser?.name ?? 'Credor'} confirmou seu pagamento`,
              sub: `${debt.description} · ${gName} · ${formatCurrency(inst.amount)} · ${relativeDate(inst.confirmedAt)}`,
              date: inst.confirmedAt,
              actionable: false,
              debtId: debt.id,
            })
          }
        }

        if (inst.status === 'pending' && isMyInst && !isCreditor) {
          list.push({
            id: `ev-pending-${inst.id}`,
            type: 'pending_reminder',
            title: `Você deve ${formatCurrency(inst.amount)} a ${creditorUser?.name ?? 'alguém'}`,
            sub: `${debt.description} · ${gName} · em aberto`,
            date: debt.createdAt,
            actionable: true,
            debtId: debt.id,
            installmentId: inst.id,
          })
        }

        if (inst.chargeLink && isMyInst && inst.status === 'pending') {
          list.push({
            id: `ev-charged-${inst.id}`,
            type: 'charged',
            title: `${creditorUser?.name ?? 'Alguém'} te enviou uma cobrança`,
            sub: `${debt.description} · ${formatCurrency(inst.amount)} · ${relativeDate(inst.chargeLink.expiresAt)}`,
            date: debt.createdAt,
            actionable: true,
            debtId: debt.id,
            installmentId: inst.id,
          })
        }
      }
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [currentUser, debts, groups])

  const unreadCount = events.filter((e) => !readEventIds.has(e.id)).length
  const actionCount = events.filter((e) => e.actionable && !readEventIds.has(e.id)).length
  const filtered = tab === 'action' ? events.filter((e) => e.actionable) : events

  // Group by date section
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>()
    for (const ev of filtered) {
      const g = dateGroup(ev.date)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(ev)
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }))
  }, [filtered])

  return (
    <div
      className="no-scrollbar min-h-dvh overflow-auto"
      style={{ background: '#F5F5F8', padding: '52px 20px 110px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-.02em' }}>
          Atividade
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllEventsRead(events.map((e) => e.id))}
            style={{
              marginTop: 6, fontSize: 12.5, fontWeight: 700, color: '#FF5436',
              background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Marcar tudo como lido
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#9A9AA4', marginBottom: 18 }}>
        {unreadCount > 0
          ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
          : `${events.length} evento${events.length !== 1 ? 's' : ''} · tudo lido`}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', background: '#EBEBEF', borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {([
          ['all', 'Tudo', null] as const,
          ['action', 'Para você', actionCount] as const,
        ]).map(([key, label, count]) => {
          const active = tab === key
          return (
            <button key={key} type="button" onClick={() => setTab(key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '9px 8px', borderRadius: 11, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? '#15151A' : '#9A9AA4',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              }}
            >
              {label}
              {count !== null && count > 0 && (
                <span style={{
                  background: active ? '#FF5436' : '#C8C8D0',
                  color: '#fff', fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 999,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Events grouped by date */}
      {grouped.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 20, padding: '32px 20px',
          textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#15151A' }}>
            {tab === 'action' ? 'Nenhuma ação necessária' : 'Nenhuma atividade ainda'}
          </div>
          <div style={{ fontSize: 12.5, color: '#9A9AA4', marginTop: 4 }}>
            {tab === 'action' ? 'Você está em dia com tudo!' : 'Quando houver movimentações, aparecerão aqui.'}
          </div>
        </div>
      ) : (
        grouped.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 800, color: '#9A9AA4',
              letterSpacing: '.06em', textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  isRead={readEventIds.has(ev.id)}
                  onOpen={() => {
                    markEventRead(ev.id)
                    if (ev.debtId) navigate(`/dividas/${ev.debtId}`)
                  }}
                  onMarkRead={() => markEventRead(ev.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── EventCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  event: ActivityEvent
  isRead: boolean
  onOpen: () => void
  onMarkRead: () => void
}

function EventCard({ event, isRead, onOpen, onMarkRead }: CardProps) {
  const style = EVENT_STYLE[event.type]

  const ACTION_LABEL: Partial<Record<EventType, string>> = {
    proof_received: 'Revisar comprovante',
    pending_reminder: 'Ver e pagar',
    charged: 'Ver cobrança',
  }

  const actionLabel = ACTION_LABEL[event.type]
  const showUnread = !isRead

  return (
    <div
      onClick={() => { if (isRead) return; onMarkRead() }}
      style={{
        background: showUnread ? '#fff' : '#FAFAFC',
        borderRadius: 16, padding: 14,
        boxShadow: [
          showUnread
            ? `inset 3px 0 0 ${event.actionable ? '#FF5436' : '#C8C8D0'}`
            : null,
          showUnread ? '0 2px 10px rgba(0,0,0,.06)' : '0 1px 4px rgba(0,0,0,.03)',
        ].filter(Boolean).join(', '),
        border: showUnread && event.actionable
          ? `1.5px solid ${style.bg}`
          : `1.5px solid ${showUnread ? '#EBEBEF' : 'transparent'}`,
        transition: 'background .2s',
      }}
    >

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: isRead ? '#F0F0F4' : style.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, opacity: isRead ? 0.6 : 1,
          transition: 'background .2s, opacity .2s',
        }}>
          {style.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: showUnread ? 700 : 600,
            fontSize: 14,
            color: isRead ? '#6B6B76' : '#1A1A1F',
            lineHeight: 1.35,
            transition: 'color .2s',
          }}>
            {event.title}
          </div>
          <div style={{ fontSize: 12, color: '#9A9AA4', marginTop: 3, lineHeight: 1.4 }}>
            {event.sub}
          </div>
        </div>

        {/* Right side: unread dot OR "lida" tag */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {showUnread ? (
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: event.actionable ? '#FF5436' : '#C8C8D0', marginTop: 3 }} />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#C0C0C8', marginTop: 4 }}>lida</span>
          )}
          {showUnread && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead() }}
              style={{
                fontSize: 11, fontWeight: 700, color: '#9A9AA4',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Marcar lida
            </button>
          )}
        </div>
      </div>

      {/* CTA button — only for unread actionable */}
      {actionLabel && event.actionable && !isRead && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen() }}
          style={{
            marginTop: 12, width: '100%', padding: '10px',
            borderRadius: 11, fontWeight: 800, fontSize: 13.5,
            background: style.bg, color: style.color,
            border: 'none', cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
