import { type APIRequestContext, type Page, expect } from '@playwright/test'

export const API = 'http://localhost:8000'

export interface Fixtures {
  password: string
  alice: { id: number; email: string; name: string }
  bob: { id: number; email: string; name: string }
  group: { id: string; name: string }
  debt_mercado: { id: string }
  debt_uber: { id: string }
  charge_token: string
}

/** Zera e semeia o banco de E2E, devolvendo os ids/credenciais do cenário. */
export async function resetE2E(request: APIRequestContext): Promise<Fixtures> {
  const res = await request.post(`${API}/api/__e2e__/reset/`)
  expect(res.ok(), 'reset de E2E deve responder 2xx').toBeTruthy()
  return res.json()
}

/** Faz login real pela UI e espera o dashboard carregar. */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('Seu saldo')).toBeVisible()
}
