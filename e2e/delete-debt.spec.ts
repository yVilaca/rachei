import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P1 — credor exclui uma dívida (sem pagamento em andamento) e ela some do grupo.
test('credor exclui uma dívida', async ({ page, request }) => {
  const fx = await resetE2E(request)
  await login(page, fx.alice.email, fx.password)

  await page.goto(`/dividas/${fx.debt_mercado.id}`) // alice é credora → visão do credor
  await page.getByRole('button', { name: 'Excluir dívida' }).click() // botão lixeira (aria-label)
  await page.getByRole('button', { name: 'Excluir', exact: true }).click() // confirma na folha

  await expect(page).toHaveURL(new RegExp(`/grupos/${fx.group.id}`))
  await expect(page.getByText('Mercado')).toHaveCount(0)
})
