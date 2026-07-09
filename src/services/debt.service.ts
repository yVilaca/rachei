import api from '../lib/api'
import type { Debt, Installment, NewDebtInput } from '../types'

// ── Tipos brutos da API (snake_case) ─────────────────────────────────────────

interface ApiUserMin {
  id: number
  name: string
}

interface ApiParcelaBalance {
  id: string
  debtor: ApiUserMin
  amount_cents: number
  status: 'pending' | 'awaiting_confirmation' | 'paid'
}

interface ApiParcelaDetail extends ApiParcelaBalance {
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
}

// ── Transformadores ───────────────────────────────────────────────────────────

function toInstallment(raw: ApiParcelaBalance | ApiParcelaDetail): Installment {
  const detail = raw as ApiParcelaDetail
  return {
    id: raw.id,
    debtor: { id: String(raw.debtor.id), name: raw.debtor.name },
    amountCents: raw.amount_cents,
    status: raw.status,
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
  }
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
      paid_by_id: Number(input.paidByUserId),
      split_type: input.splitType,
      parcelas: input.debtors.map((d) => ({
        debtor_id: Number(d.userId),
        amount_cents: d.amountCents,
      })),
    }
    const { data } = await api.post<ApiDebt>('/api/despesas/', payload)
    return toDebt(data)
  },

  async sendProof(installmentId: string, fileUrl: string): Promise<void> {
    await api.post(`/api/parcelas/${installmentId}/comprovante/`, { file_url: fileUrl })
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
