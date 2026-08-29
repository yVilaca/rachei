import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import type { User } from '../types'

const USER = { id: '1', name: 'Alice', email: 'a@x.com' } as unknown as User

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    localStorage.clear()
  })

  it('setAccessToken marca autenticado', () => {
    useAuthStore.getState().setAccessToken('tok')
    const s = useAuthStore.getState()
    expect(s.accessToken).toBe('tok')
    expect(s.isAuthenticated).toBe(true)
  })

  it('clearAuth reseta tudo', () => {
    useAuthStore.setState({ accessToken: 'tok', currentUser: USER, pendingToken: 'p', isAuthenticated: true })
    useAuthStore.getState().clearAuth()
    const s = useAuthStore.getState()
    expect(s.accessToken).toBeNull()
    expect(s.currentUser).toBeNull()
    expect(s.pendingToken).toBeNull()
    expect(s.isAuthenticated).toBe(false)
  })

  it('NÃO persiste o accessToken em localStorage (só o usuário)', () => {
    useAuthStore.getState().setUser(USER)
    useAuthStore.getState().setAccessToken('segredo')
    const persisted = JSON.parse(localStorage.getItem('rachei-auth') || '{}')
    expect(persisted.state.currentUser).toMatchObject({ id: '1' })
    expect(persisted.state.accessToken).toBeUndefined() // token vive só em memória/cookie
  })
})
