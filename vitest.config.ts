import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Config exclusiva do Vitest (fora do tsc -b do build).
// Mantida separada da vite.config.ts para não misturar os tipos de Vite
// vendorizados pelo Vitest com os do projeto.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Vitest cuida dos unit/integration em src/*.test.*; e2e/*.spec.* é do Playwright.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      // Mede a lógica do app (serviços, libs, páginas/componentes e stores);
      // fora: testes, mocks, primitivos de UI (shadcn) e o entrypoint.
      include: ['src/services/**', 'src/lib/**', 'src/features/**', 'src/components/**', 'src/stores/**'],
      exclude: ['**/*.test.{ts,tsx}', 'src/test/**', 'src/components/ui/**', 'src/main.tsx'],
    },
  },
})
