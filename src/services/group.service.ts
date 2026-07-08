import api from '../lib/api'
import type { GroupSummary, GroupDetail, GroupMember, UserMin, ContatoPendente } from '../types'

// ── Tipos brutos da API (snake_case) ─────────────────────────────────────────

interface ApiUserMin {
  id: number   // User model usa BigAutoField, não UUID
  name: string
}

interface ApiContatoPendente {
  name: string
}

interface ApiGroupMember {
  id: number
  user: ApiUserMin | null
  contato_pendente: ApiContatoPendente | null
  role: 'admin' | 'member'
  status: 'ativo' | 'inativo' | 'pendente_confirmacao' | 'pendente_registro'
}

interface ApiGroupSummary {
  id: string
  name: string
  emoji?: string
  archived: boolean
  member_count: number
}

interface ApiGroupDetail {
  id: string
  name: string
  emoji?: string
  archived: boolean
  members: ApiGroupMember[]
}

interface ApiPendingGroup {
  membership_id: number
  group: { id: string; name: string; emoji?: string }
  adicionado_por: { id: string; name: string } | null
}

interface PaginatedResponse<T> {
  count: number
  results: T[]
}

// ── Transformadores ───────────────────────────────────────────────────────────

function toUserMin(raw: ApiUserMin): UserMin {
  return { id: String(raw.id), name: raw.name }
}

function toContatoPendente(raw: ApiContatoPendente): ContatoPendente {
  return { name: raw.name }
}

function toGroupMember(raw: ApiGroupMember): GroupMember {
  return {
    id: raw.id,
    user: raw.user ? toUserMin(raw.user) : null,
    contatoPendente: raw.contato_pendente ? toContatoPendente(raw.contato_pendente) : null,
    role: raw.role,
    status: raw.status,
  }
}

function toGroupSummary(raw: ApiGroupSummary): GroupSummary {
  return {
    id: raw.id,
    name: raw.name,
    emoji: raw.emoji,
    archived: raw.archived,
    memberCount: raw.member_count,
  }
}

function toGroupDetail(raw: ApiGroupDetail): GroupDetail {
  return {
    id: raw.id,
    name: raw.name,
    emoji: raw.emoji,
    archived: raw.archived,
    members: raw.members.map(toGroupMember),
  }
}

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface PendingGroup {
  membershipId: number
  group: { id: string; name: string; emoji?: string }
  adicionadoPor: { id: string; name: string } | null
}

export interface AddMemberInput {
  phone: string
  name?: string
  role?: 'admin' | 'member'
}

// ── Service ───────────────────────────────────────────────────────────────────

export const groupService = {
  async getGroups(): Promise<GroupSummary[]> {
    const { data } = await api.get<PaginatedResponse<ApiGroupSummary>>('/api/grupos/')
    return data.results.map(toGroupSummary)
  },

  async getGroup(id: string): Promise<GroupDetail> {
    const { data } = await api.get<ApiGroupDetail>(`/api/grupos/${id}/`)
    return toGroupDetail(data)
  },

  async createGroup(name: string, emoji?: string): Promise<GroupSummary> {
    const { data } = await api.post<ApiGroupSummary>('/api/grupos/', { name, emoji })
    return toGroupSummary(data)
  },

  async addMember(groupId: string, input: AddMemberInput): Promise<GroupMember> {
    const { data } = await api.post<ApiGroupMember>(`/api/grupos/${groupId}/membros/`, input)
    return toGroupMember(data)
  },

  async removeMember(groupId: string, memberId: number): Promise<void> {
    await api.delete(`/api/grupos/${groupId}/membros/${memberId}/`)
  },

  async getPendingGroups(): Promise<PendingGroup[]> {
    const { data } = await api.get<ApiPendingGroup[]>('/api/me/grupos-pendentes/')
    return data.map((p) => ({
      membershipId: p.membership_id,
      group: p.group,
      adicionadoPor: p.adicionado_por,
    }))
  },

  async confirmGroup(groupId: string, aceitar: boolean): Promise<void> {
    await api.post(`/api/grupos/${groupId}/confirmar/`, { aceitar })
  },

  async checkPhone(phone: string): Promise<boolean> {
    const { data } = await api.get<{ exists: boolean }>('/api/auth/check-phone/', { params: { phone } })
    return data.exists
  },
}
