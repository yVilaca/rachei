import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import BottomNav from './BottomNav'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types'

const API = 'http://localhost:8000'

describe('BottomNav', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: { id: '1', name: 'Lucas' } as unknown as User })
    server.use(http.get(`${API}/api/atividade/`, () => HttpResponse.json({
      count: 0, next: null, previous: null, unread_count: 0, results: [],
    })))
  })

  it('renderiza os itens de navegação', () => {
    render(<MemoryRouter initialEntries={['/dashboard']}><BottomNav /></MemoryRouter>)
    expect(screen.getByText('Grupos')).toBeInTheDocument()
    expect(screen.getByText('Atividade')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })
})
