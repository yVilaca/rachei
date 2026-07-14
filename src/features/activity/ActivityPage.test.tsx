import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import ActivityPage from './ActivityPage'

const API = 'http://localhost:8000'

// Regressão: a versão antiga quebrava em runtime (groups undefined / campos stale).
// Este teste renderiza a página de verdade, consumindo o backend via MSW.
describe('ActivityPage', () => {
  it('carrega e renderiza eventos vindos da API', async () => {
    server.use(http.get(`${API}/api/atividade/`, () => HttpResponse.json({
      count: 1, next: null, previous: null, unread_count: 1,
      results: [{
        id: 'ev-created-d1', tipo: 'debt_created_me',
        despesa_id: 'd1', parcela_id: null, data: new Date().toISOString(), lido: false,
        descricao: 'Jantar na praia', grupo_nome: 'Praia', valor_cents: 10000, contraparte: null,
      }],
    })))

    render(
      <MemoryRouter>
        <ActivityPage />
      </MemoryRouter>,
    )

    // título da página aparece imediatamente
    expect(screen.getByText('Atividade')).toBeInTheDocument()
    // evento renderizado após o fetch
    expect(await screen.findByText(/Você registrou "Jantar na praia"/)).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há eventos', async () => {
    server.use(http.get(`${API}/api/atividade/`, () => HttpResponse.json({
      count: 0, next: null, previous: null, unread_count: 0, results: [],
    })))

    render(
      <MemoryRouter>
        <ActivityPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Nenhuma atividade ainda')).toBeInTheDocument()
  })
})
