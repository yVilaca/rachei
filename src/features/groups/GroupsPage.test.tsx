import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import GroupsPage from './GroupsPage'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

const API = 'http://localhost:8000'

function mockGroups(groups: unknown[], pending: unknown[] = []) {
  server.use(
    http.get(`${API}/api/grupos/`, () => HttpResponse.json({ count: groups.length, results: groups })),
    http.get(`${API}/api/me/grupos-pendentes/`, () => HttpResponse.json(pending)),
    // saldo por grupo consulta as despesas de cada grupo
    http.get(`${API}/api/grupos/:id/despesas/`, () => HttpResponse.json([])),
  )
}

describe('GroupsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: { id: '1', name: 'Lucas Silva' } as unknown as User })
  })

  it('lista os grupos vindos da API', async () => {
    mockGroups([
      { id: 'g1', name: 'Casa', emoji: '🏠', archived: false, member_count: 3 },
      { id: 'g2', name: 'Praia', emoji: '🏖️', archived: false, member_count: 4 },
    ])
    render(<MemoryRouter><GroupsPage /></MemoryRouter>)
    expect(await screen.findByText('Casa')).toBeInTheDocument()
    expect(screen.getByText('Praia')).toBeInTheDocument()
  })

  it('mostra convites de grupo pendentes de confirmação', async () => {
    mockGroups(
      [{ id: 'g1', name: 'Casa', emoji: '🏠', archived: false, member_count: 2 }],
      [{ membership_id: 7, group: { id: 'g9', name: 'Viagem' }, adicionado_por: { id: '2', name: 'Ana' } }],
    )
    render(<MemoryRouter><GroupsPage /></MemoryRouter>)
    expect(await screen.findByText('Viagem')).toBeInTheDocument()
  })
})
