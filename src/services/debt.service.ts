import { useAppStore } from '../stores/app.store'
import type { Debt, Installment, InstallmentStatus, NewDebtInput } from '../types'

export const debtService = {
  getDebtsByGroup: (groupId: string): Promise<Debt[]> => {
    // TODO: replace with fetch GET /api/groups/:groupId/debts
    return Promise.resolve(useAppStore.getState().getDebtsByGroup(groupId))
  },

  getInstallmentsByDebtor: (debtorUserId: string): Promise<Installment[]> => {
    // TODO: replace with fetch GET /api/installments?debtorUserId=:id
    return Promise.resolve(useAppStore.getState().getInstallmentsByDebtor(debtorUserId))
  },

  createDebt: (input: NewDebtInput): Promise<Debt> => {
    // TODO: replace with fetch POST /api/debts
    useAppStore.getState().addDebt(input)
    const debts = useAppStore.getState().debts
    return Promise.resolve(debts[debts.length - 1])
  },

  updateInstallmentStatus: (
    installmentId: string,
    status: InstallmentStatus,
    proofFileUrl?: string,
  ): Promise<void> => {
    // TODO: replace with fetch PATCH /api/installments/:id/status
    useAppStore.getState().updateInstallmentStatus(installmentId, status, proofFileUrl)
    return Promise.resolve()
  },

  generateChargeLink: (installmentId: string): Promise<string> => {
    // TODO: replace with fetch POST /api/installments/:id/charge-link (server signs token)
    const link = useAppStore.getState().generateChargeLink(installmentId)
    return Promise.resolve(link)
  },
}
