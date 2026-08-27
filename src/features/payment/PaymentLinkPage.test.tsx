import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import PaymentLinkPage from './PaymentLinkPage'

const API = 'http://localhost:8000'

function charge(overrides: Record<string, unknown> = {}) {
  server.use(http.get(`${API}/api/pagamento/tok1/`, () => HttpResponse.json({
    token: 'tok1',
    devedor: { id: 2, name: 'Bob Dias' },
    credor: { id: 1, name: 'Alice Costa' },
    descricao: 'Hospedagem',
    valor_centavos: 46000,
    status_parcela: 'pending',
    expires_at: '2026-02-01T00:00:00Z',
    expirado: false,
    ...overrides,
  })))
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/pagar/tok1']}>
      <Routes><Route path="/pagar/:token" element={<PaymentLinkPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('PaymentLinkPage (página pública de cobrança)', () => {
  it('renderiza a cobrança com valor e descrição', async () => {
    charge()
    renderPage()
    expect(await screen.findByText('Hospedagem')).toBeInTheDocument()
    expect(screen.getByText('R$ 460,00')).toBeInTheDocument()
    expect(screen.getByText('Sua parte')).toBeInTheDocument()
  })

  it('mostra "Pago" quando a parcela já está quitada', async () => {
    charge({ status_parcela: 'paid' })
    renderPage()
    expect((await screen.findAllByText('Pago')).length).toBeGreaterThan(0)
  })
})
