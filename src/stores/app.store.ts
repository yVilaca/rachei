import { create } from 'zustand'
import type { Group, Debt, Installment, InstallmentStatus, NewDebtInput } from '../types'
import { MOCK_GROUPS, MOCK_DEBTS, MOCK_USERS } from '../lib/mock-data'
import { generateToken } from '../lib/utils'

interface AppStore {
  groups: Group[]
  debts: Debt[]
  readEventIds: Set<string>
  addDebt: (input: NewDebtInput) => void
  updateInstallmentStatus: (installmentId: string, status: InstallmentStatus, proofFileUrl?: string) => void
  generateChargeLink: (installmentId: string) => string
  getDebtsByGroup: (groupId: string) => Debt[]
  getInstallmentsByDebtor: (debtorUserId: string) => Installment[]
  markEventRead: (id: string) => void
  markAllEventsRead: (ids: string[]) => void
}

export const useAppStore = create<AppStore>()((set, get) => ({
  groups: MOCK_GROUPS,
  debts: MOCK_DEBTS,
  readEventIds: new Set<string>(),

  addDebt: (input: NewDebtInput) => {
    const id = `debt-${Date.now()}`
    const newDebt: Debt = {
      id,
      groupId: input.groupId,
      description: input.description,
      totalAmountCents: input.totalAmountCents,
      paidByUserId: input.paidByUserId,
      splitType: input.splitType,
      createdBy: input.paidByUserId,
      createdAt: new Date().toISOString(),
      installments: input.debtors.map((d, i) => {
        const isSelf = d.userId === input.paidByUserId
        return {
          id: `inst-${Date.now()}-${i}`,
          debtId: id,
          debtorUserId: d.userId,
          amountCents: d.amountCents,
          status: (isSelf ? 'paid' : 'pending') as InstallmentStatus,
          paidAt: isSelf ? new Date().toISOString() : undefined,
          confirmedAt: isSelf ? new Date().toISOString() : undefined,
          debtor: MOCK_USERS.find((u) => u.id === d.userId)!,
        }
      }),
    }
    set((state) => ({ debts: [...state.debts, newDebt] }))
  },

  updateInstallmentStatus: (installmentId: string, status: InstallmentStatus, proofFileUrl?: string) => {
    set((state) => ({
      debts: state.debts.map((debt) => ({
        ...debt,
        installments: debt.installments.map((inst) =>
          inst.id === installmentId
            ? {
                ...inst,
                status,
                paidAt: status === 'awaiting_confirmation' ? new Date().toISOString() : inst.paidAt,
                confirmedAt: status === 'paid' ? new Date().toISOString() : inst.confirmedAt,
                proof: proofFileUrl
                  ? { id: `proof-${Date.now()}`, installmentId, fileUrl: proofFileUrl, uploadedAt: new Date().toISOString() }
                  : inst.proof,
              }
            : inst
        ),
      })),
    }))
  },

  generateChargeLink: (installmentId: string) => {
    const token = generateToken()
    set((state) => ({
      debts: state.debts.map((debt) => ({
        ...debt,
        installments: debt.installments.map((inst) =>
          inst.id === installmentId
            ? {
                ...inst,
                chargeLink: {
                  id: `link-${Date.now()}`,
                  installmentId,
                  token,
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
              }
            : inst
        ),
      })),
    }))
    return `${window.location.origin}/pagar/${token}`
  },

  getDebtsByGroup: (groupId: string) => get().debts.filter((d) => d.groupId === groupId),

  getInstallmentsByDebtor: (debtorUserId: string) =>
    get().debts.flatMap((d) => d.installments.filter((i) => i.debtorUserId === debtorUserId)),

  markEventRead: (id: string) =>
    set((state) => ({ readEventIds: new Set([...state.readEventIds, id]) })),

  markAllEventsRead: (ids: string[]) =>
    set((state) => ({ readEventIds: new Set([...state.readEventIds, ...ids]) })),
}))
