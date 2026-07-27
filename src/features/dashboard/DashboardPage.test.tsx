import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import DashboardPage from './DashboardPage'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

const API = 'http://localhost:8000'

const EMPTY_DASHBOARD = {
  total_a_receber: 0, total_a_pagar: 0,
  a_receber: [], a_pagar: [], saldo_por_pessoa: [], grupos: [],
}

function dashboard(overrides: Partial<typeof EMPTY_DASHBOARD>) {
  server.use(http.get(`${API}/api/dashboard/`, () => HttpResponse.json({ ...EMPTY_DASHBOARD, ...overrides })))
}

function acerto(pessoas: unknown[], aConfirmar: unknown[] = []) {
  server.use(http.get(`${API}/api/acertar/`, () => HttpResponse.json({ pessoas, a_confirmar: aConfirmar })))
}

function renderDash() {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ currentUser: { id: '1', name: 'Lucas Silva' } as unknown as User })
  })

  it('mostra saldo consolidado positivo quando te devem mais', async () => {
    dashboard({ total_a_receber: 10000, total_a_pagar: 4000 })
    acerto([])
    renderDash()
    expect(await screen.findByText('Te devem mais do que você deve')).toBeInTheDocument()
    expect(screen.getByText('+R$ 60,00')).toBeInTheDocument()
  })

  it('exibe "Acertar contas" quando há dívida mútua compensável', async () => {
    dashboard({ total_a_receber: 5000, total_a_pagar: 4000 })
    acerto([{ pessoa: { id: 2, name: 'Paulo' }, saldo_cents: 1000, compensavel: true, acerto_enviado: false }])
    renderDash()
    expect(await screen.findByText('Acertar contas')).toBeInTheDocument()
  })

  it('esconde "Acertar contas" quando não há o que compensar', async () => {
    dashboard({ total_a_receber: 0, total_a_pagar: 4000 })
    acerto([{ pessoa: { id: 2, name: 'Paulo' }, saldo_cents: -4000, compensavel: false, acerto_enviado: false }])
    renderDash()
    // espera o dashboard carregar (título aparece) antes de afirmar ausência
    expect(await screen.findByText('Seu saldo')).toBeInTheDocument()
    expect(screen.queryByText('Acertar contas')).not.toBeInTheDocument()
  })
})
