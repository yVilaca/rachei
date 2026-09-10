import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../lib/utils'
import { activityService, type ActivityEvent, type ActivityType } from '../../services/activity.service'

// ── Estilo por tipo de evento ────────────────────────────────────────────────

const EVENT_STYLE: Record<ActivityType, { icon: string; bg: string; color: string }> = {
  proof_received:     { icon: '📎', bg: '#FFF4EF', color: '#E86A2E' },
  payment_confirmed:  { icon: '✅', bg: '#E9F9F0', color: '#0E8F5C' },
  debt_created_me:    { icon: '💸', bg: '#EEF2FF', color: '#4B6FE5' },
  debt_added:         { icon: '🔔', bg: '#FFF0ED', color: '#FF5436' },
  pending_reminder:   { icon: '⏳', bg: '#FFF8EE', color: '#B57400' },
  charged:            { icon: '📩', bg: '#F0EDFF', color: '#7C3AED' },
}

const ACTIONABLE: ReadonlySet<ActivityType> = new Set<ActivityType>([
  'proof_received', 'pending_reminder', 'charged',
])

const ACTION_LABEL: Partial<Record<ActivityType, string>> = {
  proof_received: 'Revisar comprovante',
  pending_reminder: 'Ver e pagar',
  charged: 'Ver cobrança',
}

// ── Datas ────────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'agora há pouco'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffH < 24) return `há ${diffH}h`
  if (diffD === 1) return 'ontem'
  return `há ${diffD} dias`
}

function dateGroup(iso: string): string {
  const diffD = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diffD === 0) return 'Hoje'
  if (diffD === 1) return 'Ontem'
  if (diffD < 7) return 'Esta semana'
  return 'Mais antigo'
}

const GROUP_ORDER = ['Hoje', 'Ontem', 'Esta semana', 'Mais antigo']

// ── Texto do evento (composto no cliente a partir dos dados do backend) ────────

function eventText(e: ActivityEvent): { title: string; sub: string } {
  const rel = relativeDate(e.date)
  const who = e.counterparty ?? 'Alguém'
  switch (e.type) {
    case 'debt_created_me':
      return { title: `Você registrou "${e.description}"`, sub: `${e.groupName} · ${formatCurrency(e.amountCents)} · ${rel}` }
    case 'debt_added':
      return { title: `${who} adicionou você a "${e.description}"`, sub: `${e.groupName} · ${rel}` }
    case 'pending_reminder':
      return { title: `Você deve ${formatCurrency(e.amountCents)} a ${e.counterparty ?? 'alguém'}`, sub: `${e.description} · ${e.groupName} · em aberto` }
    case 'charged':
      return { title: `${who} te enviou uma cobrança`, sub: `${e.description} · ${formatCurrency(e.amountCents)}` }
    case 'proof_received':
      return { title: `${who} enviou um comprovante`, sub: `${e.description} · ${e.groupName} · aguardando sua confirmação` }
    case 'payment_confirmed':
      return e.id.startsWith('ev-mypaid-')
        ? { title: `${e.counterparty ?? 'O credor'} confirmou seu pagamento`, sub: `${e.description} · ${e.groupName} · ${formatCurrency(e.amountCents)} · ${rel}` }
        : { title: `Pagamento de ${e.counterparty ?? 'alguém'} confirmado`, sub: `${e.description} · ${e.groupName} · ${formatCurrency(e.amountCents)} · ${rel}` }
  }
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<'all' | 'action'>('all')

  useEffect(() => {
    let cancelled = false
    activityService.getActivity()
      .then(({ events }) => { if (!cancelled) { setEvents(events); setLoading(false) } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const markRead = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)))
    activityService.markRead([id]).catch(() => {})
  }

  const markAllRead = () => {
    const unreadIds = events.filter((e) => !e.read).map((e) => e.id)
    if (unreadIds.length === 0) return
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })))
    activityService.markRead(unreadIds).catch(() => {})
  }

  const unreadCount = events.filter((e) => !e.read).length
  const actionCount = events.filter((e) => ACTIONABLE.has(e.type) && !e.read).length
  const filtered = tab === 'action' ? events.filter((e) => ACTIONABLE.has(e.type)) : events

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
      style={{ background: '#F5F5F8', padding: '52px 20px 110px', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 28, color: '#15151A', letterSpacing: '-.02em' }}>
          Atividade
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              marginTop: 6, fontSize: 12.5, fontWeight: 700, color: '#FF5436',
              background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Marcar tudo como lido
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, color: '#6B6B76', marginBottom: 18 }}>
        {loading
          ? 'Carregando...'
          : unreadCount > 0
          ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
          : `${events.length} evento${events.length !== 1 ? 's' : ''} · tudo lido`}
      </div>

      {/* Filtros */}
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
                color: active ? '#15151A' : '#6B6B76',
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

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 72, background: '#fff', borderRadius: 16, opacity: 0.5 }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#15151A' }}>Não foi possível carregar</div>
          <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 4 }}>Tente novamente em instantes.</div>
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#15151A' }}>
            {tab === 'action' ? 'Nenhuma ação necessária' : 'Nenhuma atividade ainda'}
          </div>
          <div style={{ fontSize: 12.5, color: '#6B6B76', marginTop: 4 }}>
            {tab === 'action' ? 'Você está em dia com tudo!' : 'Quando houver movimentações, aparecerão aqui.'}
          </div>
        </div>
      ) : (
        grouped.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 800, color: '#6B6B76',
              letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10,
            }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onOpen={() => {
                    markRead(ev.id)
                    if (ev.debtId) navigate(`/dividas/${ev.debtId}`)
                  }}
                  onMarkRead={() => markRead(ev.id)}
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

function EventCard({ event, onOpen, onMarkRead }: { event: ActivityEvent; onOpen: () => void; onMarkRead: () => void }) {
  const style = EVENT_STYLE[event.type]
  const actionable = ACTIONABLE.has(event.type)
  const actionLabel = ACTION_LABEL[event.type]
  const { title, sub } = eventText(event)
  const showUnread = !event.read

  return (
    <div
      onClick={() => { if (!event.read) onMarkRead() }}
      style={{
        background: showUnread ? '#fff' : '#FAFAFC',
        borderRadius: 16, padding: 14,
        boxShadow: [
          showUnread ? `inset 3px 0 0 ${actionable ? '#FF5436' : '#C8C8D0'}` : null,
          showUnread ? '0 2px 10px rgba(0,0,0,.06)' : '0 1px 4px rgba(0,0,0,.03)',
        ].filter(Boolean).join(', '),
        border: showUnread && actionable
          ? `1.5px solid ${style.bg}`
          : `1.5px solid ${showUnread ? '#EBEBEF' : 'transparent'}`,
        transition: 'background .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: event.read ? '#F0F0F4' : style.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, opacity: event.read ? 0.6 : 1,
          transition: 'background .2s, opacity .2s',
        }}>
          {style.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: showUnread ? 700 : 600, fontSize: 14,
            color: event.read ? '#6B6B76' : '#1A1A1F', lineHeight: 1.35, transition: 'color .2s',
          }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: '#6B6B76', marginTop: 3, lineHeight: 1.4 }}>
            {sub}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {showUnread ? (
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: actionable ? '#FF5436' : '#C8C8D0', marginTop: 3 }} />
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#C0C0C8', marginTop: 4 }}>lida</span>
          )}
          {showUnread && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkRead() }}
              style={{
                fontSize: 11, fontWeight: 700, color: '#6B6B76',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap',
              }}
            >
              Marcar lida
            </button>
          )}
        </div>
      </div>

      {actionLabel && actionable && !event.read && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen() }}
          style={{
            marginTop: 12, width: '100%', padding: '10px',
            borderRadius: 11, fontWeight: 800, fontSize: 13.5,
            background: style.bg, color: style.color, border: 'none', cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
