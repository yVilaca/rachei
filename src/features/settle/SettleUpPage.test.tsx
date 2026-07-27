import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw'
import SettleUpPage from './SettleUpPage'

const API = 'http://localhost:8000'

function resumo(pessoas: unknown[], aConfirmar: unknown[] = []) {
  server.use(http.get(`${API}/api/acertar/`, () => HttpResponse.json({ pessoas, a_confirmar: aConfirmar })))
}

function renderPage() {
  render(<MemoryRouter><SettleUpPage /></MemoryRouter>)
}

describe('SettleUpPage', () => {
  it('estado vazio quando não há nada a compensar', async () => {
    resumo([])
    renderPage()
    expect(await screen.findByText('Nada a compensar')).toBeInTheDocument()
  })

  it('lista par compensável com CTA "Compensar"', async () => {
    resumo([{ pessoa: { id: 2, name: 'Paulo Neri' }, saldo_cents: 1000, compensavel: true, acerto_enviado: false }])
    renderPage()
    expect(await screen.findByText('Dá para compensar')).toBeInTheDocument()
    expect(screen.getByText('Paulo Neri')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compensar' })).toBeInTheDocument()
  })

  it('mostra "Proposta enviada" quando já foi proposto', async () => {
    resumo([{ pessoa: { id: 2, name: 'Paulo' }, saldo_cents: 1000, compensavel: true, acerto_enviado: true }])
    renderPage()
    expect(await screen.findByText(/Proposta enviada/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compensar' })).not.toBeInTheDocument()
  })

  it('proposta recebida oferece Confirmar e Recusar', async () => {
    resumo([], [{ id: 'a1', de: { id: 3, name: 'Maria' }, saldo_cents: -2500 }])
    renderPage()
    expect(await screen.findByText('Aguardando sua confirmação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeInTheDocument()
  })
})
