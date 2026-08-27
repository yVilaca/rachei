import { test, expect } from '@playwright/test'
import { resetE2E } from './support/e2e'

// P1 — página pública de cobrança (sem login) mostra a dívida do link.
test('página pública de cobrança mostra a dívida', async ({ page, request }) => {
  const fx = await resetE2E(request)

  await page.goto(`/pagar/${fx.charge_token}`) // rota pública, sem autenticação
  await expect(page.getByText('Mercado')).toBeVisible()
  await expect(page.getByText('R$ 50,00')).toBeVisible()
})
