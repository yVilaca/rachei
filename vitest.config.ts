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
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/lib/**'],
    },
  },
})
