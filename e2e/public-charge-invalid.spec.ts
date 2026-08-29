import { test, expect } from '@playwright/test'

// P1 (negativo) — token de cobrança inexistente/expirado não resolve: a página
// pública mostra o estado de erro em vez de vazar qualquer dívida. Cobre também,
// por tabela, o link expirado (mesmo 404 → mesma tela).
test('link de cobrança inválido mostra estado de erro', async ({ page }) => {
  await page.goto('/pagar/00000000-0000-0000-0000-000000000000')

  await expect(page.getByText('Link inválido ou expirado')).toBeVisible()
  // não vaza nenhuma dívida do seed
  await expect(page.getByText('Mercado')).toHaveCount(0)
})
