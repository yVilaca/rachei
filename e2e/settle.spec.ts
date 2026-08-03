import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P0.4 — acertar contas por compensação: alice propõe, bob confirma.
// Cenário semeado: alice deve 4000 ao bob (Uber) e bob deve 5000 à alice (Mercado).
test('acertar contas: alice propõe compensação e bob confirma', async ({ browser, request }) => {
  const fx = await resetE2E(request)

  // Alice propõe a compensação.
  const aliceCtx = await browser.newContext()
  const alice = await aliceCtx.newPage()
  await login(alice, fx.alice.email, fx.password)
  await alice.getByText('Acertar contas').click() // navegação SPA (sem re-bootstrap)
  await expect(alice.getByText('Dá para compensar')).toBeVisible()
  await alice.getByRole('button', { name: 'Compensar' }).click()
  await alice.getByRole('button', { name: 'Enviar proposta' }).click()
  await expect(alice.getByText(/aguardando Bob/)).toBeVisible()

  // Bob confirma a proposta recebida.
  const bobCtx = await browser.newContext()
  const bob = await bobCtx.newPage()
  await login(bob, fx.bob.email, fx.password)
  await bob.getByText('Acertar contas').click() // navegação SPA (sem re-bootstrap)
  await expect(bob.getByText('Aguardando sua confirmação')).toBeVisible()
  await bob.getByRole('button', { name: 'Confirmar' }).first().click() // card
  await bob.getByRole('button', { name: 'Confirmar' }).last().click()  // sheet
  // Estado durável (não o toast transitório): a proposta some após a compensação.
  await expect(bob.getByText('Aguardando sua confirmação')).toBeHidden()

  await aliceCtx.close()
  await bobCtx.close()
})
