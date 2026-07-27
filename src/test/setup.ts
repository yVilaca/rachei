import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw'

// Requisição sem handler = erro (pega URL/typo antes de virar bug silencioso)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup() // desmonta componentes entre testes (evita DOM/estado vazando)
  server.resetHandlers()
})
afterAll(() => server.close())
