import type { User, Group, Debt, ChargeLink } from '../types'

export const MOCK_CURRENT_USER: User = {
  id: 'user-sofia',
  name: 'Sofia Mendes',
  email: 'sofia@email.com',
  phone: '11999990000',
  plan: 'free',
  createdAt: '2026-01-10T10:00:00Z',
}

export const MOCK_USERS: User[] = [
  MOCK_CURRENT_USER,
  { id: 'user-lucas', name: 'Lucas Costa', email: 'lucas@email.com', plan: 'free', createdAt: '2026-01-11T10:00:00Z' },
  { id: 'user-carol', name: 'Carol Alves', email: 'carol@email.com', plan: 'free', createdAt: '2026-01-12T10:00:00Z' },
  { id: 'user-bruno', name: 'Bruno Reis', email: 'bruno@email.com', plan: 'free', createdAt: '2026-01-13T10:00:00Z' },
  { id: 'user-ana', name: 'Ana Lima', email: 'ana@email.com', plan: 'free', createdAt: '2026-01-14T10:00:00Z' },
]

export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-floripa',
    name: 'Viagem Floripa',
    createdBy: 'user-sofia',
    archived: false,
    createdAt: '2026-05-01T10:00:00Z',
    members: [
      { userId: 'user-sofia', groupId: 'group-floripa', role: 'admin', joinedAt: '2026-05-01T10:00:00Z', user: MOCK_USERS[0] },
      { userId: 'user-lucas', groupId: 'group-floripa', role: 'member', joinedAt: '2026-05-01T10:00:00Z', user: MOCK_USERS[1] },
      { userId: 'user-carol', groupId: 'group-floripa', role: 'member', joinedAt: '2026-05-01T10:00:00Z', user: MOCK_USERS[2] },
      { userId: 'user-bruno', groupId: 'group-floripa', role: 'member', joinedAt: '2026-05-01T10:00:00Z', user: MOCK_USERS[3] },
    ],
  },
  {
    id: 'group-republica',
    name: 'República 2026',
    createdBy: 'user-lucas',
    archived: false,
    createdAt: '2026-02-01T10:00:00Z',
    members: [
      { userId: 'user-sofia', groupId: 'group-republica', role: 'member', joinedAt: '2026-02-01T10:00:00Z', user: MOCK_USERS[0] },
      { userId: 'user-lucas', groupId: 'group-republica', role: 'admin', joinedAt: '2026-02-01T10:00:00Z', user: MOCK_USERS[1] },
      { userId: 'user-ana', groupId: 'group-republica', role: 'member', joinedAt: '2026-02-01T10:00:00Z', user: MOCK_USERS[4] },
    ],
  },
]

export const MOCK_DEBTS: Debt[] = [
  {
    id: 'debt-1',
    groupId: 'group-floripa',
    description: 'Rodízio japonês',
    totalAmount: 240.0,
    paidByUserId: 'user-sofia',
    splitType: 'equal',
    createdBy: 'user-sofia',
    createdAt: '2026-06-01T20:00:00Z',
    installments: [
      { id: 'inst-1a', debtId: 'debt-1', debtorUserId: 'user-lucas', amount: 80.0, status: 'paid', paidAt: '2026-06-03T10:00:00Z', confirmedAt: '2026-06-03T11:00:00Z', debtor: MOCK_USERS[1], proof: { id: 'proof-1', installmentId: 'inst-1a', fileUrl: '', uploadedAt: '2026-06-03T10:00:00Z' } },
      { id: 'inst-1b', debtId: 'debt-1', debtorUserId: 'user-carol', amount: 80.0, status: 'awaiting_confirmation', paidAt: '2026-06-04T09:00:00Z', debtor: MOCK_USERS[2], proof: { id: 'proof-2', installmentId: 'inst-1b', fileUrl: '', uploadedAt: '2026-06-04T09:00:00Z' } },
      { id: 'inst-1c', debtId: 'debt-1', debtorUserId: 'user-bruno', amount: 80.0, status: 'pending', debtor: MOCK_USERS[3] },
    ],
  },
  {
    id: 'debt-2',
    groupId: 'group-floripa',
    description: 'Airbnb 3 noites',
    totalAmount: 900.0,
    paidByUserId: 'user-lucas',
    splitType: 'equal',
    createdBy: 'user-lucas',
    createdAt: '2026-05-28T10:00:00Z',
    installments: [
      { id: 'inst-2a', debtId: 'debt-2', debtorUserId: 'user-sofia', amount: 225.0, status: 'pending', debtor: MOCK_USERS[0], chargeLink: { id: 'link-1', installmentId: 'inst-2a', token: 'abc123tk', expiresAt: '2026-07-20T10:00:00Z' } },
      { id: 'inst-2b', debtId: 'debt-2', debtorUserId: 'user-carol', amount: 225.0, status: 'pending', debtor: MOCK_USERS[2] },
      { id: 'inst-2c', debtId: 'debt-2', debtorUserId: 'user-bruno', amount: 225.0, status: 'paid', paidAt: '2026-06-01T10:00:00Z', confirmedAt: '2026-06-01T11:00:00Z', debtor: MOCK_USERS[3], proof: { id: 'proof-3', installmentId: 'inst-2c', fileUrl: '', uploadedAt: '2026-06-01T10:00:00Z' } },
    ],
  },
  {
    id: 'debt-3',
    groupId: 'group-republica',
    description: 'Conta de luz maio',
    totalAmount: 180.0,
    paidByUserId: 'user-sofia',
    splitType: 'equal',
    createdBy: 'user-sofia',
    createdAt: '2026-06-05T10:00:00Z',
    installments: [
      { id: 'inst-3a', debtId: 'debt-3', debtorUserId: 'user-lucas', amount: 60.0, status: 'paid', paidAt: '2026-06-06T10:00:00Z', confirmedAt: '2026-06-06T11:00:00Z', debtor: MOCK_USERS[1], proof: { id: 'proof-4', installmentId: 'inst-3a', fileUrl: '', uploadedAt: '2026-06-06T10:00:00Z' } },
      { id: 'inst-3b', debtId: 'debt-3', debtorUserId: 'user-ana', amount: 60.0, status: 'pending', debtor: MOCK_USERS[4] },
    ],
  },
  {
    id: 'debt-4',
    groupId: 'group-republica',
    description: 'Internet mensal',
    totalAmount: 120.0,
    paidByUserId: 'user-lucas',
    splitType: 'equal',
    createdBy: 'user-lucas',
    createdAt: '2026-06-08T10:00:00Z',
    installments: [
      { id: 'inst-4a', debtId: 'debt-4', debtorUserId: 'user-sofia', amount: 40.0, status: 'pending', debtor: MOCK_USERS[0] },
      { id: 'inst-4b', debtId: 'debt-4', debtorUserId: 'user-ana', amount: 40.0, status: 'pending', debtor: MOCK_USERS[4] },
    ],
  },
]

export const MOCK_CHARGE_LINKS: ChargeLink[] = [
  { id: 'link-1', installmentId: 'inst-2a', token: 'abc123tk', expiresAt: '2026-07-20T10:00:00Z' },
  { id: 'link-2', installmentId: 'inst-1c', token: 'xyz987tk', expiresAt: '2026-07-21T10:00:00Z' },
]
