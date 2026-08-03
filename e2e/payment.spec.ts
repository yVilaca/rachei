import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P0.3 — confirmação dupla: bob (devedor) declara o pagamento e alice (credora)
// confirma o recebimento. Dois usuários = dois contextos de browser.
test('confirmação dupla: devedor declara e credor confirma', async ({ browser, request }) => {
  const fx = await resetE2E(request)
  const debtUrl = `/dividas/${fx.debt_mercado.id}`

  // Bob declara que pagou.
  const bobCtx = await browser.newContext()
  const bob = await bobCtx.newPage()
  await login(bob, fx.bob.email, fx.password)
  await bob.goto(debtUrl)
  await bob.getByRole('button', { name: 'Já paguei' }).click()
  await expect(bob.getByText('Pagamento em análise')).toBeVisible()

  // Alice confirma o recebimento.
  const aliceCtx = await browser.newContext()
  const alice = await aliceCtx.newPage()
  await login(alice, fx.alice.email, fx.password)
  await alice.goto(debtUrl)
  await alice.getByRole('button', { name: 'Confirmar recebimento' }).click()
  await expect(alice.getByText('✓ Pagamento confirmado')).toBeVisible()

  await bobCtx.close()
  await aliceCtx.close()
})
