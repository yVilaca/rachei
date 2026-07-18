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
    notifCobrancas: (data.notif_cobracas as boolean) ?? true,
    notifConfirmacoes: (data.notif_confirmacoes as boolean) ?? true,
    notifLembretes: (data.notif_lembretes as boolean) ?? true,
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

  async register(name: string, email: string, phone: string, password: string): Promise<User> {
    const { data } = await api.post('/api/auth/register/', { name, email, phone, password })
    const user = mapUser(data.user)
    useAuthStore.getState().setAccessToken(data.access)
    useAuthStore.getState().setUser(user)
    return user
  },

  async verifyPhone(code: string): Promise<void> {
    await api.post('/api/auth/phone/verify/', { code })
  },

  async resendPhoneSms(): Promise<void> {
    await api.post('/api/auth/phone/resend/', {})
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

  async updateProfile(input: {
    name?: string
    notifCobrancas?: boolean
    notifConfirmacoes?: boolean
    notifLembretes?: boolean
  }): Promise<User> {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.notifCobrancas !== undefined) payload.notif_cobracas = input.notifCobrancas
    if (input.notifConfirmacoes !== undefined) payload.notif_confirmacoes = input.notifConfirmacoes
    if (input.notifLembretes !== undefined) payload.notif_lembretes = input.notifLembretes
    const { data } = await api.patch('/api/auth/me/', payload)
    const user = mapUser(data)
    useAuthStore.getState().setUser(user)   // reflete no app na hora
    return user
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/password/forgot/', { email })
  },

  async resetPassword(email: string, code: string, password: string): Promise<void> {
    await api.post('/api/auth/password/reset/', { email, code, password })
  },
}
