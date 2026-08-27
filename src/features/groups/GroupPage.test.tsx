import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import GroupPage from './GroupPage'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

const API = 'http://localhost:8000'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/grupos/g1']}>
      <Routes><Route path="/grupos/:id" element={<GroupPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: { id: '1', name: 'Alice' } as unknown as User })
    server.use(
      http.get(`${API}/api/grupos/g1/`, () => HttpResponse.json({
        id: 'g1', name: 'Casa', emoji: '🏠', archived: false,
        members: [
          { id: 1, user: { id: 1, name: 'Alice' }, contato_pendente: null, role: 'admin', status: 'ativo' },
          { id: 2, user: { id: 2, name: 'Bob' }, contato_pendente: null, role: 'member', status: 'ativo' },
        ],
      })),
      http.get(`${API}/api/grupos/g1/despesas/`, () => HttpResponse.json([
        {
          id: 'd1', group_id: 'g1', description: 'Churrasco', total_amount_cents: 6000,
          split_type: 'custom', paid_by: { id: 1, name: 'Alice' }, created_at: '2026-01-01T00:00:00Z',
          parcelas: [{ id: 'p1', debtor: { id: 2, name: 'Bob' }, amount_cents: 6000, status: 'pending' }],
        },
      ])),
    )
  })

  it('renderiza o grupo e suas dívidas', async () => {
    renderPage()
    expect(await screen.findByText('Casa')).toBeInTheDocument()
    expect(await screen.findByText('Churrasco')).toBeInTheDocument()
  })
})
