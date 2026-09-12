import api from '../lib/api'
import type { GroupSummary } from '../types'

// ── Tipos brutos da API ───────────────────────────────────────────────────────

interface ApiUserMin { id: number; name: string }

interface ApiDashboard {
  total_a_receber: number
  total_a_pagar: number
  a_receber: Array<{
    installment_id: string
    debt_id: string
    description: string
    group_name: string
    amount_cents: number
    status: string
    // id numérico (usuário) ou 'p<n>' (contato pendente)
    debtor: { id: number | string; name: string; pending?: boolean }
  }>
  a_pagar: Array<{
    installment_id: string
    debt_id: string
    description: string
    group_name: string
    amount_cents: number
    status: string
    creditor: ApiUserMin
  }>
  saldo_por_pessoa: Array<{
    user: ApiUserMin
    balance_cents: number
  }>
  grupos: Array<{
    id: string
    name: string
    emoji?: string
    archived: boolean
    member_count: number
  }>
}

// ── Tipos frontend ────────────────────────────────────────────────────────────

export interface CreditItem {
  installmentId: string
  debtId: string
  description: string
  groupName: string
  amountCents: number
  status: string
  debtorName: string
  debtorId: string
}

export interface OwedItem {
  installmentId: string
  debtId: string
  description: string
  groupName: string
  amountCents: number
  status: string
  creditorName: string
  creditorId: string
}

export interface BalanceEntry {
  userId: string
  userName: string
  balanceCents: number
}

export interface DashboardData {
  totalAReceber: number
  totalAPagar: number
  aReceber: CreditItem[]
  aPagar: OwedItem[]
  saldoPorPessoa: BalanceEntry[]
  grupos: GroupSummary[]
}

// ── Service ───────────────────────────────────────────────────────────────────

export const dashboardService = {
  async get(): Promise<DashboardData> {
    const { data } = await api.get<ApiDashboard>('/api/dashboard/')
    return {
      totalAReceber: data.total_a_receber,
      totalAPagar: data.total_a_pagar,
      aReceber: data.a_receber.map((i) => ({
        installmentId: i.installment_id,
        debtId: i.debt_id,
        description: i.description,
        groupName: i.group_name,
        amountCents: i.amount_cents,
        status: i.status,
        debtorName: i.debtor.name,
        debtorId: String(i.debtor.id),
      })),
      aPagar: data.a_pagar.map((i) => ({
        installmentId: i.installment_id,
        debtId: i.debt_id,
        description: i.description,
        groupName: i.group_name,
        amountCents: i.amount_cents,
        status: i.status,
        creditorName: i.creditor.name,
        creditorId: String(i.creditor.id),
      })),
      saldoPorPessoa: data.saldo_por_pessoa.map((s) => ({
        userId: String(s.user.id),
        userName: s.user.name,
        balanceCents: s.balance_cents,
      })),
      grupos: data.grupos.map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        archived: g.archived,
        memberCount: g.member_count,
      })),
    }
  },
}
