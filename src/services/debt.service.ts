import api from '../lib/api'
import type { Debt, Installment, NewDebtInput, SplitType } from '../types'

// ── Tipos brutos da API (snake_case) ─────────────────────────────────────────

interface ApiUserMin {
  id: number
  name: string
}

// Devedor da parcela: usuário real (id numérico) ou contato pendente (id 'p<n>').
interface ApiDebtor {
  id: number | string
  name: string
  pending: boolean
}

interface ApiParcelaBalance {
  id: string
  debtor: ApiDebtor
  amount_cents: number
  status: 'pending' | 'awaiting_confirmation' | 'paid'
}

interface ApiParcelaDetail extends ApiParcelaBalance {
  paid_via?: 'payment' | 'compensation'
  paid_at: string | null
  confirmed_at: string | null
  comprovante: { id: string; file_url: string; uploaded_at: string } | null
  charge_link_token: string | null
}

interface ApiDebt {
  id: string
  group_id: string
  group_name?: string
  description: string
  total_amount_cents: number
  split_type: 'equal' | 'custom'
  paid_by: ApiUserMin
  created_at: string
  parcelas: (ApiParcelaBalance | ApiParcelaDetail)[]
  editavel?: boolean
}

// ── Transformadores ───────────────────────────────────────────────────────────

function toInstallment(raw: ApiParcelaBalance | ApiParcelaDetail): Installment {
  const detail = raw as ApiParcelaDetail
  return {
    id: raw.id,
    debtor: { id: String(raw.debtor.id), name: raw.debtor.name, pending: raw.debtor.pending },
    amountCents: raw.amount_cents,
    status: raw.status,
    paidVia: detail.paid_via ?? undefined,
    paidAt: detail.paid_at ?? undefined,
    confirmedAt: detail.confirmed_at ?? undefined,
    proof: detail.comprovante
      ? { id: detail.comprovante.id, fileUrl: detail.comprovante.file_url, uploadedAt: detail.comprovante.uploaded_at }
      : undefined,
    chargeLinkToken: detail.charge_link_token ?? undefined,
  }
}

function toDebt(raw: ApiDebt): Debt {
  return {
    id: raw.id,
    groupId: String(raw.group_id),
    groupName: raw.group_name,
    description: raw.description,
    totalAmountCents: raw.total_amount_cents,
    paidBy: { id: String(raw.paid_by.id), name: raw.paid_by.name },
    splitType: raw.split_type,
    createdAt: raw.created_at,
    installments: raw.parcelas.map(toInstallment),
    editavel: raw.editavel,
  }
}

// Uma parcela de entrada: contato pendente (id 'p<n>') → debtor_contato_id;
// usuário real → debtor_id.
function toParcelaPayload(d: { userId: string; amountCents: number }) {
  const base = { amount_cents: d.amountCents }
  return d.userId.startsWith('p')
    ? { ...base, debtor_contato_id: Number(d.userId.slice(1)) }
    : { ...base, debtor_id: Number(d.userId) }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const debtService = {
  async getDebtsByGroup(groupId: string): Promise<Debt[]> {
    const { data } = await api.get<ApiDebt[]>(`/api/grupos/${groupId}/despesas/`)
    return data.map(toDebt)
  },

  async getDebt(id: string): Promise<Debt> {
    const { data } = await api.get<ApiDebt>(`/api/despesas/${id}/`)
    return toDebt(data)
  },

  async createDebt(input: NewDebtInput): Promise<Debt> {
    const payload = {
      grupo_id: input.groupId,
      description: input.description,
      total_amount_cents: input.totalAmountCents,
      split_type: input.splitType,
      parcelas: input.debtors.map(toParcelaPayload),
    }
    const { data } = await api.post<ApiDebt>('/api/despesas/', payload)
    return toDebt(data)
  },

  async updateDebt(
    id: string,
    input: { description: string; totalAmountCents?: number; splitType?: SplitType; debtors?: { userId: string; amountCents: number }[] },
  ): Promise<Debt> {
    const payload: Record<string, unknown> = { description: input.description }
    if (input.debtors) {
      payload.total_amount_cents = input.totalAmountCents
      payload.split_type = input.splitType
      payload.parcelas = input.debtors.map(toParcelaPayload)
    }
    const { data } = await api.patch<ApiDebt>(`/api/despesas/${id}/`, payload)
    return toDebt(data)
  },

  async deleteDebt(id: string): Promise<void> {
    await api.delete(`/api/despesas/${id}/`)
  },

  async sendProof(installmentId: string, file?: File): Promise<void> {
    if (!file) {
      await api.post(`/api/parcelas/${installmentId}/comprovante/`, {})
      return
    }
    // Upload real (multipart). Content-Type undefined → o browser define o
    // boundary correto do multipart/form-data.
    const form = new FormData()
    form.append('arquivo', file)
    await api.post(`/api/parcelas/${installmentId}/comprovante/`, form, {
      headers: { 'Content-Type': undefined as unknown as string },
    })
  },

  // Baixa o comprovante (endpoint autenticado) como blob e devolve um object URL
  // para exibir/abrir — a mídia nunca é servida por URL pública.
  async fetchProof(url: string): Promise<string> {
    const { data } = await api.get(url, { responseType: 'blob' })
    return URL.createObjectURL(data as Blob)
  },

  async confirmPayment(installmentId: string): Promise<void> {
    await api.patch(`/api/parcelas/${installmentId}/confirmar/`)
  },

  async rejectPayment(installmentId: string): Promise<void> {
    await api.post(`/api/parcelas/${installmentId}/rejeitar/`)
  },

  async generateChargeLink(installmentId: string): Promise<string> {
    const { data } = await api.post<{ token: string }>(`/api/parcelas/${installmentId}/link-cobranca/`)
    return data.token
  },
}
