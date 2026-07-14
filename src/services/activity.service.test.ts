import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { activityService } from './activity.service'

const API = 'http://localhost:8000'

describe('activityService.getActivity — mapeamento', () => {
  it('mapeia evento enriquecido e unread_count', async () => {
    server.use(http.get(`${API}/api/atividade/`, () => HttpResponse.json({
      count: 1, next: null, previous: null, unread_count: 1,
      results: [{
        id: 'ev-pending-p2', tipo: 'pending_reminder',
        despesa_id: 'd1', parcela_id: 'p2', data: '2026-07-08T00:00:00Z', lido: false,
        descricao: 'Jantar', grupo_nome: 'Praia', valor_cents: 5000, contraparte: 'Lucas',
      }],
    })))

    const { events, unreadCount } = await activityService.getActivity()

    expect(unreadCount).toBe(1)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: 'ev-pending-p2',
      type: 'pending_reminder',
      debtId: 'd1',
      installmentId: 'p2',
      read: false,
      description: 'Jantar',
      groupName: 'Praia',
      amountCents: 5000,
      counterparty: 'Lucas',
    })
  })
})

describe('activityService.markRead — batching de 50', () => {
  it('divide >50 ids em múltiplas chamadas', async () => {
    const batches: number[] = []
    server.use(http.post(`${API}/api/atividade/marcar-lida/`, async ({ request }) => {
      const body = (await request.json()) as { evento_ids: string[] }
      batches.push(body.evento_ids.length)
      return HttpResponse.json({ marcados: body.evento_ids.length })
    }))

    const ids = Array.from({ length: 51 }, (_, i) => `ev-${i}`)
    await activityService.markRead(ids)

    expect(batches).toEqual([50, 1]) // respeita o limite de 50/chamada do backend
  })

  it('não faz chamada quando lista vazia', async () => {
    let called = false
    server.use(http.post(`${API}/api/atividade/marcar-lida/`, () => {
      called = true
      return HttpResponse.json({ marcados: 0 })
    }))
    await activityService.markRead([])
    expect(called).toBe(false)
  })
})
