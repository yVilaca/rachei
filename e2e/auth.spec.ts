import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P0.1 — login real contra o Django (senha conferida, cookie de sessão, dados reais).
test('login real leva ao dashboard com os dados do usuário', async ({ page, request }) => {
  const fx = await resetE2E(request)

  await login(page, fx.alice.email, fx.password)

  // Saudação com o nome real vindo do backend.
  await expect(page.getByText(/Olá, Alice/)).toBeVisible()
})
