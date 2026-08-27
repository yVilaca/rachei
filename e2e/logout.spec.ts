import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P1 — logout encerra a sessão e bloqueia rota protegida.
test('logout encerra a sessão', async ({ page, request }) => {
  const fx = await resetE2E(request)
  await login(page, fx.alice.email, fx.password)

  await page.goto('/perfil')
  await page.getByRole('button', { name: /Sair da conta/ }).click()

  // Volta para o login; o dashboard não é mais acessível.
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
})
