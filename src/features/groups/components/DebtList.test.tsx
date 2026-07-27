import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DebtList from './DebtList'
import { useAuthStore } from '../../../stores/auth.store'
import type { Debt, Installment, User } from '../../../types'

function setUser(id: string) {
  useAuthStore.setState({ currentUser: { id, name: 'Eu' } as unknown as User })
}

let seq = 0
function parcela(debtorId: string, status: Installment['status'], amountCents = 5000): Installment {
  return { id: `p${seq++}`, debtor: { id: debtorId, name: `U${debtorId}` }, amountCents, status }
}

function makeDebt(paidById: string, installments: Installment[]): Debt {
  return {
    id: `d${seq++}`, groupId: 'g1', groupName: 'Praia', description: 'Jantar',
    totalAmountCents: installments.reduce((a, i) => a + i.amountCents, 0),
    paidBy: { id: paidById, name: `U${paidById}` }, splitType: 'custom',
    createdAt: new Date().toISOString(), installments,
  }
}

function renderList(debts: Debt[]) {
  render(<MemoryRouter><DebtList debts={debts} /></MemoryRouter>)
}

describe('DebtList — status conforme a perspectiva do usuário', () => {
  beforeEach(() => { seq = 0 })

  it('credor com pendências de terceiros vê "A receber" (não vermelho de dívida)', () => {
    setUser('1') // eu paguei; outros me devem
    renderList([makeDebt('1', [parcela('2', 'pending'), parcela('3', 'pending')])])
    expect(screen.getByText('A receber')).toBeInTheDocument()
    // não mostra o antigo status vermelho "N pendentes" para o credor
    expect(screen.queryByText(/\d+ pendente/i)).not.toBeInTheDocument()
  })

  it('devedor com parcela pendente vê "Você deve"', () => {
    setUser('2') // outro pagou; eu devo
    renderList([makeDebt('1', [parcela('2', 'pending'), parcela('3', 'paid')])])
    expect(screen.getByText('Você deve')).toBeInTheDocument()
  })

  it('devedor que declarou pagamento vê "Em análise"', () => {
    setUser('2')
    renderList([makeDebt('1', [parcela('2', 'awaiting_confirmation')])])
    expect(screen.getByText('Em análise')).toBeInTheDocument()
  })

  it('tudo pago vira "Quitada"', () => {
    setUser('1')
    renderList([makeDebt('1', [parcela('2', 'paid'), parcela('3', 'paid')])])
    expect(screen.getByText('Quitada')).toBeInTheDocument()
  })

  it('devedor já quitado, mas com pendências de outros, vê "Sua parte quitada"', () => {
    setUser('2') // eu (2) paguei; 3 ainda deve; credor é 1
    renderList([makeDebt('1', [parcela('2', 'paid'), parcela('3', 'pending')])])
    expect(screen.getByText('Sua parte quitada')).toBeInTheDocument()
  })
})
