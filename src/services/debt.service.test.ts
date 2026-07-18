import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { debtService } from './debt.service'

const API = 'http://localhost:8000'

const apiDebt = {
  id: 'd1',
  group_id: 'g1',
  group_name: 'Praia',
  description: 'Jantar',
  total_amount_cents: 10000,
  split_type: 'custom',
  paid_by: { id: 1, name: 'Lucas Vilaça' },
  created_at: '2026-07-08T21:22:58Z',
  parcelas: [
    { id: 'p1', debtor: { id: 1, name: 'Lucas Vilaça' }, amount_cents: 5000, status: 'paid',
      paid_at: '2026-07-08T21:22:58Z', confirmed_at: '2026-07-08T21:22:58Z', comprovante: null, charge_link_token: null },
    { id: 'p2', debtor: { id: 2, name: 'Juan Alvares' }, amount_cents: 5000, status: 'pending',
      paid_at: null, confirmed_at: null,
      comprovante: { id: 'c1', file_url: 'http://x/f.png', uploaded_at: '2026-07-09T00:00:00Z' },
      charge_link_token: 'tok123' },
  ],
}

describe('debtService.getDebt — mapeamento de contrato snake→camel', () => {
  it('mapeia paid_by, debtor, valores e campos aninhados', async () => {
    server.use(http.get(`${API}/api/despesas/:id/`, () => HttpResponse.json(apiDebt)))

    const debt = await debtService.getDebt('d1')

    expect(debt.paidBy).toEqual({ id: '1', name: 'Lucas Vilaça' }) // id vira string
    expect(debt.groupName).toBe('Praia')
    expect(debt.totalAmountCents).toBe(10000)
    expect(debt.installments).toHaveLength(2)

    const p2 = debt.installments[1]
    expect(p2.debtor).toEqual({ id: '2', name: 'Juan Alvares' })
    expect(p2.amountCents).toBe(5000)
    expect(p2.chargeLinkToken).toBe('tok123')
    expect(p2.proof).toEqual({ id: 'c1', fileUrl: 'http://x/f.png', uploadedAt: '2026-07-09T00:00:00Z' })
    expect(debt.installments[0].proof).toBeUndefined()
  })
})

describe('debtService.getDebtsByGroup', () => {
  it('mapeia lista (endpoint sem paginação)', async () => {
    server.use(http.get(`${API}/api/grupos/:id/despesas/`, () => HttpResponse.json([apiDebt])))
    const debts = await debtService.getDebtsByGroup('g1')
    expect(debts).toHaveLength(1)
    expect(debts[0].id).toBe('d1')
    expect(debts[0].paidBy.name).toBe('Lucas Vilaça')
  })
})

describe('debtService.createDebt — payload camel→snake', () => {
  it('envia snake_case e NÃO envia paid_by_id (credor = request.user no backend)', async () => {
    let captured: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/despesas/`, async ({ request }) => {
      captured = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(apiDebt, { status: 201 })
    }))

    await debtService.createDebt({
      groupId: 'g1',
      description: 'Jantar',
      totalAmountCents: 10000,
      splitType: 'custom',
      debtors: [{ userId: '2', amountCents: 5000 }],
    })

    expect(captured).not.toBeNull()
    expect(captured!).toMatchObject({
      grupo_id: 'g1',
      description: 'Jantar',
      total_amount_cents: 10000,
      split_type: 'custom',
      parcelas: [{ debtor_id: 2, amount_cents: 5000 }],
    })
    expect(captured!).not.toHaveProperty('paid_by_id')
  })
})

describe('debtService.updateDebt', () => {
  it('envia apenas a descrição quando não há alteração de valores', async () => {
    let captured: Record<string, unknown> | null = null
    server.use(http.patch(`${API}/api/despesas/:id/`, async ({ request }) => {
      captured = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(apiDebt)
    }))
    await debtService.updateDebt('d1', { description: 'Novo nome' })
    expect(captured).toEqual({ description: 'Novo nome' })
  })

  it('envia total + split + parcelas quando há debtors', async () => {
    let captured: Record<string, unknown> | null = null
    server.use(http.patch(`${API}/api/despesas/:id/`, async ({ request }) => {
      captured = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(apiDebt)
    }))
    await debtService.updateDebt('d1', {
      description: 'Jantar', totalAmountCents: 8000, splitType: 'custom',
      debtors: [{ userId: '2', amountCents: 8000 }],
    })
    expect(captured!).toMatchObject({
      description: 'Jantar', total_amount_cents: 8000, split_type: 'custom',
      parcelas: [{ debtor_id: 2, amount_cents: 8000 }],
    })
  })
})

describe('debtService.deleteDebt', () => {
  it('faz DELETE no endpoint da despesa', async () => {
    let called = false
    server.use(http.delete(`${API}/api/despesas/:id/`, () => {
      called = true
      return new HttpResponse(null, { status: 204 })
    }))
    await debtService.deleteDebt('d1')
    expect(called).toBe(true)
  })
})
