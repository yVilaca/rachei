import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { acertoService } from './acerto.service'

const API = 'http://localhost:8000'

describe('acertoService.getResumo', () => {
  it('mapeia pessoas (saldo líquido/compensável) e propostas a confirmar', async () => {
    server.use(http.get(`${API}/api/acertar/`, () => HttpResponse.json({
      pessoas: [
        { pessoa: { id: 2, name: 'Juan' }, saldo_cents: 1000, compensavel: true, acerto_enviado: false },
      ],
      a_confirmar: [
        { id: 'abc', de: { id: 3, name: 'Maria' }, saldo_cents: -2500 },
      ],
    })))
    const r = await acertoService.getResumo()
    expect(r.pessoas[0]).toEqual({
      id: '2', name: 'Juan', saldoCents: 1000, compensavel: true, acertoEnviado: false,
    })
    expect(r.aConfirmar[0]).toEqual({
      id: 'abc', de: { id: '3', name: 'Maria' }, saldoCents: -2500,
    })
  })
})

describe('acertoService.propor', () => {
  it('envia para_id e retorna o id da proposta', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/acertar/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ id: 'novo-id' }, { status: 201 })
    }))
    const id = await acertoService.propor('2')
    expect(body).toEqual({ para_id: 2 })
    expect(id).toBe('novo-id')
  })
})

describe('acertoService.confirmar / rejeitar', () => {
  it('confirmar chama o endpoint da proposta', async () => {
    let hit = ''
    server.use(http.post(`${API}/api/acertar/:id/confirmar/`, ({ params }) => {
      hit = params.id as string
      return HttpResponse.json({ status: 'confirmed' })
    }))
    await acertoService.confirmar('xyz')
    expect(hit).toBe('xyz')
  })

  it('rejeitar chama o endpoint da proposta', async () => {
    let hit = ''
    server.use(http.post(`${API}/api/acertar/:id/rejeitar/`, ({ params }) => {
      hit = params.id as string
      return HttpResponse.json({ status: 'rejected' })
    }))
    await acertoService.rejeitar('xyz')
    expect(hit).toBe('xyz')
  })
})
