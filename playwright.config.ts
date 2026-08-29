import { defineConfig, devices } from '@playwright/test'

// E2E full-stack: sobe o Django REAL (settings_e2e, banco rachei_e2e descartável)
// e o dev server do Vite, e roda o Chromium contra a stack completa.
// Serial (workers:1) porque os testes compartilham um único banco e o resetam.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  // 'list' para stream no terminal/painel; 'html' gera playwright-report/ (relatório + trace viewer).
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    // Artefatos para acompanhar/depurar falhas: trace navegável, vídeo e screenshot.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'python manage.py runserver 8000 --noreload --settings=config.settings_e2e',
      cwd: process.env.BACKEND_DIR || '../rachei-backend',
      url: 'http://localhost:8000/health/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm dev --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
