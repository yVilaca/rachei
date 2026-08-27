import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { groupService } from './group.service'

const API = 'http://localhost:8000'

describe('groupService', () => {
  it('getGroups mapeia a resposta paginada', async () => {
    server.use(http.get(`${API}/api/grupos/`, () => HttpResponse.json({
      count: 1,
      results: [{ id: 'g1', name: 'Casa', emoji: '🏠', archived: false, member_count: 3 }],
    })))
    const r = await groupService.getGroups()
    expect(r).toEqual([{ id: 'g1', name: 'Casa', emoji: '🏠', archived: false, memberCount: 3 }])
  })

  it('getGroup separa membro com usuário e contato pendente', async () => {
    server.use(http.get(`${API}/api/grupos/g1/`, () => HttpResponse.json({
      id: 'g1', name: 'Casa', archived: false,
      members: [
        { id: 1, user: { id: 5, name: 'Alice' }, contato_pendente: null, role: 'admin', status: 'ativo' },
        { id: 2, user: null, contato_pendente: { name: 'Bob' }, role: 'member', status: 'pendente_registro' },
      ],
    })))
    const g = await groupService.getGroup('g1')
    expect(g.members[0].user).toEqual({ id: '5', name: 'Alice' })
    expect(g.members[0].role).toBe('admin')
    expect(g.members[1].user).toBeNull()
    expect(g.members[1].contatoPendente).toEqual({ name: 'Bob' })
  })

  it('createGroup envia nome e emoji', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/grupos/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ id: 'g2', name: 'Praia', emoji: '🏖️', archived: false, member_count: 1 })
    }))
    const r = await groupService.createGroup('Praia', '🏖️')
    expect(body).toEqual({ name: 'Praia', emoji: '🏖️' })
    expect(r.id).toBe('g2')
  })

  it('addMember mapeia o membro criado', async () => {
    server.use(http.post(`${API}/api/grupos/g1/membros/`, () => HttpResponse.json({
      id: 9, user: null, contato_pendente: { name: 'Carol' }, role: 'member', status: 'pendente_registro',
    })))
    const m = await groupService.addMember('g1', { phone: '+5599900000009', name: 'Carol' })
    expect(m.id).toBe(9)
    expect(m.contatoPendente).toEqual({ name: 'Carol' })
  })

  it('getPendingGroups mapeia camelCase', async () => {
    server.use(http.get(`${API}/api/me/grupos-pendentes/`, () => HttpResponse.json([
      { membership_id: 7, group: { id: 'g3', name: 'Viagem' }, adicionado_por: { id: '5', name: 'Alice' } },
    ])))
    const r = await groupService.getPendingGroups()
    expect(r[0]).toEqual({ membershipId: 7, group: { id: 'g3', name: 'Viagem' }, adicionadoPor: { id: '5', name: 'Alice' } })
  })

  it('confirmGroup envia aceitar', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/grupos/g3/confirmar/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({})
    }))
    await groupService.confirmGroup('g3', true)
    expect(body).toEqual({ aceitar: true })
  })

  it('checkPhone retorna exists', async () => {
    server.use(http.get(`${API}/api/auth/check-phone/`, () => HttpResponse.json({ exists: true })))
    expect(await groupService.checkPhone('+5599900000001')).toBe(true)
  })
})
