export type UserPlan = 'free' | 'pro'
export type MemberRole = 'admin' | 'member'
export type MemberStatus = 'ativo' | 'inativo' | 'pendente_confirmacao' | 'pendente_registro'
export type SplitType = 'equal' | 'custom'
export type InstallmentStatus = 'pending' | 'awaiting_confirmation' | 'paid'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  plan: UserPlan
  createdAt: string
  notifCobrancas: boolean
  notifConfirmacoes: boolean
  notifLembretes: boolean
}

/** Campos mínimos retornados pelo UserListSerializer do backend. */
export interface UserMin {
  id: string
  name: string
}

export interface ContatoPendente {
  name: string
}

export interface GroupMember {
  id: number
  user: UserMin | null
  contatoPendente: ContatoPendente | null
  role: MemberRole
  status: MemberStatus
}

/** Retornado pelo endpoint de listagem (sem array de membros). */
export interface GroupSummary {
  id: string
  name: string
  emoji?: string
  archived: boolean
  memberCount: number
}

/** Retornado pelo endpoint de detalhe (com membros). */
export interface GroupDetail {
  id: string
  name: string
  emoji?: string
  archived: boolean
  members: GroupMember[]
}

/** Alias para compatibilidade com componentes que recebem o grupo completo. */
export type Group = GroupDetail

export interface Debt {
  id: string
  groupId: string
  groupName?: string
  description: string
  totalAmountCents: number
  paidBy: UserMin
  splitType: SplitType
  createdAt: string
  installments: Installment[]
  /** true = valores/exclusão liberados (ninguém pagou ainda). Só no detalhe. */
  editavel?: boolean
}

export type PaidVia = 'payment' | 'compensation'

export interface Installment {
  id: string
  debtor: UserMin
  amountCents: number
  status: InstallmentStatus
  /** Como foi quitada: pagamento normal ou compensação de dívidas. */
  paidVia?: PaidVia
  paidAt?: string
  confirmedAt?: string
  proof?: { id: string; fileUrl: string; uploadedAt: string }
  chargeLinkToken?: string
}

export interface NewDebtInput {
  groupId: string
  description: string
  totalAmountCents: number
  splitType: SplitType
  debtors: { userId: string; amountCents: number }[]
}

export interface FriendBalance {
  user: User
  balanceCents: number // positive = they owe me, negative = I owe them
}
