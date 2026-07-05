import api from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { TRUSTED_DEVICE_KEY, mapUser } from './auth.service'
import type { User } from '../types'

export interface TrustedDevice {
  id: number
  user_agent: string
  created_at: string
  last_used_at: string | null
  expires_at: string
}

export const twoFactorService = {
  async getStatus(): Promise<{ is_active: boolean }> {
    const { data } = await api.get('/api/auth/2fa/status/')
    return data
  },

  async getSetup(): Promise<{ secret: string; otpauth_uri: string }> {
    const { data } = await api.get('/api/auth/2fa/setup/')
    return data
  },

  async confirmSetup(code: string): Promise<{ backup_codes: string[] }> {
    const { data } = await api.post('/api/auth/2fa/setup/confirm/', { code })
    return data
  },

  async challenge(pendingToken: string, code: string, trustDevice: boolean): Promise<User> {
    const { data } = await api.post('/api/auth/2fa/challenge/', {
      pending_token: pendingToken,
      code,
      trust_device: trustDevice,
    })
    if (data.trusted_device_token) {
      localStorage.setItem(TRUSTED_DEVICE_KEY, data.trusted_device_token)
    }
    const user = mapUser(data.user)
    // Refresh token chega via cookie HttpOnly — não persiste no store
    useAuthStore.getState().setAccessToken(data.access)
    useAuthStore.getState().setUser(user)
    useAuthStore.getState().setPendingToken(null)
    return user
  },

  async disable(password: string, code: string): Promise<void> {
    await api.post('/api/auth/2fa/disable/', { password, code })
    localStorage.removeItem(TRUSTED_DEVICE_KEY)
  },

  async regenerateBackupCodes(code: string): Promise<{ backup_codes: string[] }> {
    const { data } = await api.post('/api/auth/2fa/backup-codes/regenerate/', { code })
    return data
  },

  async getTrustedDevices(): Promise<TrustedDevice[]> {
    const { data } = await api.get('/api/auth/2fa/trusted-devices/')
    return data
  },

  async deleteTrustedDevice(id: number): Promise<void> {
    await api.delete(`/api/auth/2fa/trusted-devices/${id}/`)
  },
}
