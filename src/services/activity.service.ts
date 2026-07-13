import api from '../lib/api'

// ── Tipos ──────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'proof_received'
  | 'payment_confirmed'
  | 'debt_created_me'
  | 'debt_added'
  | 'pending_reminder'
  | 'charged'

export interface ActivityEvent {
  id: string
  type: ActivityType
  debtId: string | null
  installmentId: string | null
  date: string
  read: boolean
  description: string
  groupName: string
  amountCents: number
  counterparty: string | null
}

// ── Tipos brutos da API (snake_case) ─────────────────────────────────────────

interface ApiEvent {
  id: string
  tipo: ActivityType
  despesa_id: string | null
  parcela_id: string | null
  data: string
  lido: boolean
  descricao: string
  grupo_nome: string
  valor_cents: number
  contraparte: string | null
}

interface ApiActivityResponse {
  count: number
  next: string | null
  previous: string | null
  results: ApiEvent[]
  unread_count: number
}

function toEvent(e: ApiEvent): ActivityEvent {
  return {
    id: e.id,
    type: e.tipo,
    debtId: e.despesa_id,
    installmentId: e.parcela_id,
    date: e.data,
    read: e.lido,
    description: e.descricao,
    groupName: e.grupo_nome,
    amountCents: e.valor_cents,
    counterparty: e.contraparte,
  }
}

// ── Service (somente leitura + marcar lido; nunca cria eventos) ────────────────

export const activityService = {
  async getActivity(): Promise<{ events: ActivityEvent[]; unreadCount: number }> {
    const { data } = await api.get<ApiActivityResponse>('/api/atividade/')
    return { events: data.results.map(toEvent), unreadCount: data.unread_count }
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<ApiActivityResponse>('/api/atividade/')
    return data.unread_count
  },

  async markRead(ids: string[]): Promise<void> {
    // backend aceita no máximo 50 ids por chamada
    for (let i = 0; i < ids.length; i += 50) {
      await api.post('/api/atividade/marcar-lida/', { evento_ids: ids.slice(i, i + 50) })
    }
  },
}
