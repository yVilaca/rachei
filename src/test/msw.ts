import { setupServer } from 'msw/node'

// Servidor MSW sem handlers padrão — cada teste declara os seus via server.use().
export const server = setupServer()
