import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import DebtDetailPage from './DebtDetailPage'
import { useAuthStore } from '../../stores/auth.store'
import type { User } from '../../types'

const API = 'http://localhost:8000'

interface ApiParcela {
  id: string; debtor: { id: number; name: string }; amount_cents: number
  status: string; paid_via?: string; paid_at?: string | null; confirmed_at?: string | null
  comprovante?: null; charge_link_token?: null
}

function apiDebt(paidById: number, parcelas: ApiParcela[]) {
  server.use(http.get(`${API}/api/despesas/d1/`, () => HttpResponse.json({
    id: 'd1', group_id: 'g1', group_name: 'Praia', description: 'Hospedagem',
    total_amount_cents: parcelas.reduce((a, p) => a + p.amount_cents, 0),
    split_type: 'custom', paid_by: { id: paidById, name: `U${paidById}` },
    created_at: new Date().toISOString(), parcelas, editavel: true,
  })))
}

function p(debtorId: number, amount: number, status: string, paidVia?: string): ApiParcela {
  return {
    id: `p${debtorId}-${status}`, debtor: { id: debtorId, name: `U${debtorId}` },
    amount_cents: amount, status, paid_via: paidVia,
    paid_at: null, confirmed_at: null, comprovante: null, charge_link_token: null,
  }
}

function renderDetail() {
  render(
    <MemoryRouter initialEntries={['/dividas/d1']}>
      <Routes><Route path="/dividas/:id" element={<DebtDetailPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('DebtDetailPage', () => {
  it('devedor com parcela pendente vê "Você deve" e o CTA de pagar', async () => {
    useAuthStore.setState({ currentUser: { id: '2', name: 'Devedor' } as unknown as User })
    apiDebt(1, [p(2, 5000, 'pending')])
    renderDetail()
    expect(await screen.findByText('Você deve')).toBeInTheDocument()
    expect(screen.getAllByText('R$ 50,00').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Já paguei' })).toBeInTheDocument()
  })

  it('mostra a parte compensada como detalhe e o resíduo em destaque', async () => {
    useAuthStore.setState({ currentUser: { id: '2', name: 'Devedor' } as unknown as User })
    // 4000 já quitados por compensação + 1000 de resíduo pendente
    apiDebt(1, [p(2, 4000, 'paid', 'compensation'), p(2, 1000, 'pending')])
    renderDetail()
    expect(await screen.findByText(/abatidos por compensação/)).toBeInTheDocument()
    expect(screen.getByText('R$ 10,00')).toBeInTheDocument() // resíduo em destaque
  })

  it('credor vê as parcelas por devedor e pode cobrar', async () => {
    useAuthStore.setState({ currentUser: { id: '1', name: 'Credor' } as unknown as User })
    apiDebt(1, [p(2, 5000, 'pending')])
    renderDetail()
    expect(await screen.findByText('Parcelas por devedor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cobrar no WhatsApp/ })).toBeInTheDocument()
  })
})
