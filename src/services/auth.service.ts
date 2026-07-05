import api from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types'

export const TRUSTED_DEVICE_KEY = 'rachei-td-token'

export function mapUser(data: Record<string, unknown>): User {
  return {
    id: String(data.id),           // backend retorna integer, normalizar para string
    name: data.name as string,
    email: data.email as string,
    phone: (data.phone as string) || undefined,
    avatarUrl: (data.avatar_url as string) || undefined,  // "" vira undefined
    plan: data.plan as User['plan'],
    createdAt: data.date_joined as string,
  }
}

export const authService = {
  async login(email: string, password: string): Promise<User | { requires2FA: true }> {
    const trusted_device_token = localStorage.getItem(TRUSTED_DEVICE_KEY) ?? undefined
    const { data } = await api.post('/api/auth/login/', { email, password, trusted_device_token })
    if (data.requires_2fa) {
      useAuthStore.getState().setPendingToken(data.pending_token)
      return { requires2FA: true }
    }
    const user = mapUser(data.user)
    // Refresh token chega via cookie HttpOnly — não persiste no store
    useAuthStore.getState().setAccessToken(data.access)
    useAuthStore.getState().setUser(user)
    return user
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post('/api/auth/register/', { name, email, password })
    const user = mapUser(data.user)
    useAuthStore.getState().setAccessToken(data.access)
    useAuthStore.getState().setUser(user)
    return user
  },

  async logout(): Promise<void> {
    try {
      // Cookie é enviado automaticamente; backend blacklista e limpa o cookie
      await api.post('/api/auth/logout/', {})
    } catch {
      // best-effort — limpa estado local independente
    }
    useAuthStore.getState().clearAuth()
  },

  async me(): Promise<User> {
    const { data } = await api.get('/api/auth/me/')
    return mapUser(data)
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/password/forgot/', { email })
  },

  async resetPassword(email: string, code: string, password: string): Promise<void> {
    await api.post('/api/auth/password/reset/', { email, code, password })
  },
}
