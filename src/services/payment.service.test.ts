import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { paymentService } from './payment.service'

const API = 'http://localhost:8000'

describe('paymentService.getCharge', () => {
  it('mapeia a cobrança pública (snake → camel)', async () => {
    server.use(http.get(`${API}/api/pagamento/tok123/`, () => HttpResponse.json({
      token: 'tok123',
      devedor: { id: 2, name: 'Bob Dias' },
      credor: { id: 1, name: 'Alice Costa' },
      descricao: 'Jantar',
      valor_centavos: 5000,
      status_parcela: 'pending',
      expires_at: '2026-01-08T00:00:00Z',
      expirado: false,
    })))
    const c = await paymentService.getCharge('tok123')
    expect(c).toEqual({
      token: 'tok123',
      debtorName: 'Bob Dias',
      creditorName: 'Alice Costa',
      description: 'Jantar',
      amountCents: 5000,
      status: 'pending',
      expiresAt: '2026-01-08T00:00:00Z',
      expired: false,
    })
  })
})
