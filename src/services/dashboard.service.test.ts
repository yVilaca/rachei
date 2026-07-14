import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { dashboardService } from './dashboard.service'

const API = 'http://localhost:8000'

describe('dashboardService.get — mapeamento do resumo', () => {
  it('mapeia totais, a_receber/a_pagar, saldo por pessoa e grupos', async () => {
    server.use(http.get(`${API}/api/dashboard/`, () => HttpResponse.json({
      total_a_receber: 5000,
      total_a_pagar: 3000,
      a_receber: [{
        installment_id: 'p2', debt_id: 'd1', description: 'Jantar', group_name: 'Praia',
        amount_cents: 5000, status: 'pending', debtor: { id: 2, name: 'Juan' },
      }],
      a_pagar: [{
        installment_id: 'p9', debt_id: 'd2', description: 'Uber', group_name: 'Rolê',
        amount_cents: 3000, status: 'pending', creditor: { id: 3, name: 'Maria' },
      }],
      saldo_por_pessoa: [{ user: { id: 2, name: 'Juan' }, balance_cents: 5000 }],
      grupos: [{ id: 'g1', name: 'Praia', emoji: '🏖️', archived: false, member_count: 3 }],
    })))

    const d = await dashboardService.get()

    expect(d.totalAReceber).toBe(5000)
    expect(d.totalAPagar).toBe(3000)
    expect(d.aReceber[0]).toMatchObject({ debtId: 'd1', debtorName: 'Juan', debtorId: '2', amountCents: 5000 })
    expect(d.aPagar[0]).toMatchObject({ debtId: 'd2', creditorName: 'Maria', creditorId: '3' })
    expect(d.saldoPorPessoa[0]).toEqual({ userId: '2', userName: 'Juan', balanceCents: 5000 })
    expect(d.grupos[0]).toMatchObject({ id: 'g1', name: 'Praia', memberCount: 3, archived: false })
  })
})
