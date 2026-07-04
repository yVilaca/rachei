import api from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types'

export const TRUSTED_DEVICE_KEY = 'rachei-td-token'

export function mapUser(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    name: data.name as string,
    email: data.email as string,
    phone: (data.phone as string) ?? undefined,
    avatarUrl: (data.avatar_url as string) ?? undefined,
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
    useAuthStore.getState().setTokens(data.access, data.refresh)
    useAuthStore.getState().setUser(user)
    return user
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post('/api/auth/register/', { name, email, password })
    const user = mapUser(data.user)
    useAuthStore.getState().setTokens(data.access, data.refresh)
    useAuthStore.getState().setUser(user)
    return user
  },

  async logout(): Promise<void> {
    const { refreshToken } = useAuthStore.getState()
    if (refreshToken) {
      try {
        await api.post('/api/auth/logout/', { refresh: refreshToken })
      } catch {
        // best-effort — clear local state regardless
      }
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
