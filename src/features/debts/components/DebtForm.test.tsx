import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import DebtForm from './DebtForm'
import { useAuthStore } from '../../../stores/auth.store'
import { groupService } from '../../../services/group.service'
import { debtService } from '../../../services/debt.service'
import type { User } from '../../../types'

vi.mock('../../../services/group.service', () => ({ groupService: { getGroup: vi.fn() } }))
vi.mock('../../../services/debt.service', () => ({ debtService: { createDebt: vi.fn(), updateDebt: vi.fn() } }))
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => vi.fn(),
}))

const GROUP = {
  id: 'g1', name: 'Casa', emoji: '🏠', archived: false,
  members: [
    { id: 1, user: { id: '1', name: 'Alice Costa' }, role: 'admin', status: 'ativo', contato_pendente: null },
    { id: 2, user: { id: '2', name: 'Bob Dias' }, role: 'member', status: 'ativo', contato_pendente: null },
    { id: 3, user: { id: '3', name: 'Carol Reis' }, role: 'member', status: 'ativo', contato_pendente: null },
  ],
}

async function setup() {
  vi.mocked(groupService.getGroup).mockResolvedValue(GROUP as never)
  vi.mocked(debtService.createDebt).mockResolvedValue({ id: 'd1' } as never)
  render(<MemoryRouter><DebtForm groupId="g1" /></MemoryRouter>)
  await screen.findByText('Bob') // grupo carregado (nomes exibidos por primeiro nome)
}

describe('DebtForm — divisão no cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ currentUser: { id: '1', name: 'Alice Costa' } as unknown as User })
  })

  it('split igual conserva o total e joga o resto no primeiro devedor', async () => {
    await setup()
    // R$100,00 entre 3 (todos vêm pré-selecionados) → 3334 + 3333 + 3333
    await userEvent.type(screen.getByPlaceholderText('0,00'), '10000')
    await userEvent.type(screen.getByPlaceholderText('Ex: Rodízio japonês 🍣'), 'Mercado')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar dívida' }))

    await waitFor(() => expect(debtService.createDebt).toHaveBeenCalled())
    const arg = vi.mocked(debtService.createDebt).mock.calls[0][0]
    const soma = arg.debtors.reduce((a, d) => a + d.amountCents, 0)
    expect(soma).toBe(10000)                       // invariante: nada some/cria
    expect(arg.debtors[0].amountCents).toBe(3334)  // primeiro absorve o resto
    expect(arg.debtors[1].amountCents).toBe(3333)
    expect(arg.debtors[2].amountCents).toBe(3333)
  })

  it('split igual divisível reparte sem resto', async () => {
    await setup()
    await userEvent.type(screen.getByPlaceholderText('0,00'), '9000') // 90,00 / 3 = 30,00
    await userEvent.type(screen.getByPlaceholderText('Ex: Rodízio japonês 🍣'), 'Uber')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar dívida' }))

    await waitFor(() => expect(debtService.createDebt).toHaveBeenCalled())
    const arg = vi.mocked(debtService.createDebt).mock.calls[0][0]
    expect(arg.debtors.map((d) => d.amountCents)).toEqual([3000, 3000, 3000])
  })

  it('não permite registrar sem valor', async () => {
    await setup()
    await userEvent.type(screen.getByPlaceholderText('Ex: Rodízio japonês 🍣'), 'Sem valor')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar dívida' }))
    // validação bloqueia o envio (mensagem aparece inline e no toast)
    expect(debtService.createDebt).not.toHaveBeenCalled()
    expect((await screen.findAllByText('Informe o valor total')).length).toBeGreaterThan(0)
  })
})
