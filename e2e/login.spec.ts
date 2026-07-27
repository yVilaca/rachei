import { test, expect } from '@playwright/test'

// Fluxo crítico: usuário faz login e chega ao dashboard com seus dados.
// Exercita, num browser real: bootstrap de auth, roteamento, rota protegida,
// store de sessão e render da página — com a API 100% stubada (hermético).

const API = 'http://localhost:8000'
const json = (body: unknown, status = 200) => ({
  status, contentType: 'application/json', body: JSON.stringify(body),
})

test('login autentica e mostra o saldo no dashboard', async ({ page }) => {
  // Fallback: qualquer /api/** não stubado responde vazio (sem erro de rede).
  await page.route(`${API}/api/**`, (route) => route.fulfill(json({})))

  // Bootstrap sem sessão → app cai na tela de login.
  await page.route(`${API}/api/auth/refresh/`, (route) => route.fulfill(json({ detail: 'no session' }, 401)))

  // Login sem 2FA.
  await page.route(`${API}/api/auth/login/`, (route) => route.fulfill(json({
    access: 'access-token',
    user: {
      id: 1, name: 'Lucas Silva', email: 'lucas@example.com',
      plan: 'free', date_joined: '2026-01-01T00:00:00Z',
    },
  })))

  // Dados do dashboard (te devem 100, você deve 40).
  await page.route(`${API}/api/dashboard/`, (route) => route.fulfill(json({
    total_a_receber: 10000, total_a_pagar: 4000,
    a_receber: [], a_pagar: [], saldo_por_pessoa: [], grupos: [],
  })))
  await page.route(`${API}/api/acertar/`, (route) => route.fulfill(json({ pessoas: [], a_confirmar: [] })))
  await page.route(`${API}/api/atividade/`, (route) => route.fulfill(json({
    count: 0, next: null, previous: null, unread_count: 0, results: [],
  })))

  await page.goto('/login')

  await page.locator('#email').fill('lucas@example.com')
  await page.locator('#password').fill('senha-secreta')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Chegou ao dashboard autenticado.
  await expect(page.getByText('Seu saldo')).toBeVisible()
  await expect(page.getByText('Olá, Lucas 👋')).toBeVisible()
  await expect(page.getByText('+R$ 60,00')).toBeVisible()
})
