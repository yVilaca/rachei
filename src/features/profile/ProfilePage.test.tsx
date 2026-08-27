import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import ProfilePage from './ProfilePage'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

const API = 'http://localhost:8000'

describe('ProfilePage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: {
        id: '1', name: 'Alice Costa', email: 'alice@x.com', plan: 'free',
        notifCobrancas: true, notifConfirmacoes: true, notifLembretes: true,
      } as unknown as User,
    })
    // TwoFactorSection consulta o status ao montar
    server.use(http.get(`${API}/api/auth/2fa/status/`, () => HttpResponse.json({ is_active: false })))
  })

  it('mostra o nome do usuário e a opção de sair', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    expect(screen.getByText('Alice Costa')).toBeInTheDocument()
    expect(screen.getByText('Sair da conta')).toBeInTheDocument()
  })

  it('lista as preferências de notificação', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    expect(screen.getByText('Cobranças recebidas')).toBeInTheDocument()
    expect(screen.getByText('Confirmações de pagamento')).toBeInTheDocument()
    expect(screen.getByText('Lembretes semanais')).toBeInTheDocument()
  })
})
