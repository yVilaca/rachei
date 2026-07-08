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
}

/** Campos mínimos retornados pelo UserListSerializer do backend. */
export interface UserMin {
  id: string
  name: string
}

export interface ContatoPendente {
  id: number
  name: string
  phone: string
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
  description: string
  totalAmountCents: number
  paidByUserId: string
  splitType: SplitType
  createdBy: string
  createdAt: string
  installments: Installment[]
}

export interface Installment {
  id: string
  debtId: string
  debtorUserId: string
  amountCents: number
  status: InstallmentStatus
  paidAt?: string
  confirmedAt?: string
  proof?: PaymentProof
  chargeLink?: ChargeLink
  debtor: User
}

export interface PaymentProof {
  id: string
  installmentId: string
  fileUrl: string
  uploadedAt: string
}

export interface ChargeLink {
  id: string
  installmentId: string
  token: string
  expiresAt: string
  usedAt?: string
}

export interface NewDebtInput {
  groupId: string
  description: string
  totalAmountCents: number
  paidByUserId: string
  splitType: SplitType
  debtors: { userId: string; amountCents: number }[]
}

export interface FriendBalance {
  user: User
  balanceCents: number // positive = they owe me, negative = I owe them
}
