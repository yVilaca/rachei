import { test, expect } from '@playwright/test'
import { resetE2E } from './support/e2e'

// P1 — caminho negativo: senha errada é rejeitada (não entra no app).
test('login com senha errada é rejeitado', async ({ page, request }) => {
  const fx = await resetE2E(request)

  await page.goto('/login')
  await page.locator('#email').fill(fx.alice.email)
  await page.locator('#password').fill('senha-totalmente-errada')
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Mostra o erro e permanece na tela de login — nunca chega ao dashboard.
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('Seu saldo')).toHaveCount(0)
})
