import { test, expect } from '@playwright/test'
import { resetE2E, login } from './support/e2e'

// P0.2 — criar uma dívida no grupo e vê-la aparecer na lista.
test('criar dívida no grupo e ela aparece', async ({ page, request }) => {
  const fx = await resetE2E(request)
  await login(page, fx.alice.email, fx.password)

  await page.goto(`/grupos/${fx.group.id}/nova-divida`)

  // Espera o form montar e o grupo carregar (devedores já vêm marcados por padrão).
  await expect(page.getByRole('button', { name: 'Registrar dívida' })).toBeVisible()
  await page.getByText('Bob', { exact: true }).waitFor() // grupo carregado → devedores marcados

  // Valor (input em centavos: digitar 15000 => R$ 150,00) e descrição.
  await page.getByPlaceholder('0,00').first().pressSequentially('15000')
  await page.getByPlaceholder(/Rodízio japonês/).fill('Churrasco de sábado')
  // Devedores já vêm marcados (todos os membros ativos) por padrão.
  await page.getByRole('button', { name: 'Registrar dívida' }).click()

  // Volta ao grupo e a dívida aparece.
  await expect(page).toHaveURL(new RegExp(`/grupos/${fx.group.id}$`))
  await expect(page.getByText('Churrasco de sábado')).toBeVisible()
})
