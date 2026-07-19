import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { acertoService } from './acerto.service'

const API = 'http://localhost:8000'

describe('acertoService.getResumo', () => {
  it('mapeia voce_deve e a_confirmar', async () => {
    server.use(http.get(`${API}/api/acertar/`, () => HttpResponse.json({
      voce_deve: [{ pessoa: { id: 2, name: 'Juan' }, valor_cents: 5000 }],
      a_confirmar: [{ pessoa: { id: 3, name: 'Maria' }, valor_cents: 3000 }],
    })))
    const r = await acertoService.getResumo()
    expect(r.voceDeve[0]).toEqual({ id: '2', name: 'Juan', amountCents: 5000 })
    expect(r.aConfirmar[0]).toEqual({ id: '3', name: 'Maria', amountCents: 3000 })
  })
})

describe('acertoService.declarar', () => {
  it('acertar com uma pessoa envia para_id', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/acertar/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ declaradas: 1 })
    }))
    await acertoService.declarar('2')
    expect(body).toEqual({ para_id: 2 })
  })

  it('acertar tudo envia corpo vazio', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/acertar/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ declaradas: 3 })
    }))
    await acertoService.declarar()
    expect(body).toEqual({})
  })
})

describe('acertoService.confirmar', () => {
  it('envia de_id', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/acertar/confirmar/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ confirmadas: 1 })
    }))
    await acertoService.confirmar('2')
    expect(body).toEqual({ de_id: 2 })
  })
})
