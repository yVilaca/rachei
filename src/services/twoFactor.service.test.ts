import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { twoFactorService } from './twoFactor.service'
import { TRUSTED_DEVICE_KEY } from './auth.service'
import { useAuthStore } from '../stores/auth.store'

const API = 'http://localhost:8000'

describe('twoFactorService', () => {
  beforeEach(() => { localStorage.clear() })

  it('getStatus retorna is_active', async () => {
    server.use(http.get(`${API}/api/auth/2fa/status/`, () => HttpResponse.json({ is_active: true })))
    expect(await twoFactorService.getStatus()).toEqual({ is_active: true })
  })

  it('getSetup retorna secret + otpauth_uri', async () => {
    server.use(http.get(`${API}/api/auth/2fa/setup/`, () => HttpResponse.json({ secret: 'ABC', otpauth_uri: 'otpauth://x' })))
    const s = await twoFactorService.getSetup()
    expect(s.secret).toBe('ABC')
    expect(s.otpauth_uri).toContain('otpauth://')
  })

  it('confirmSetup envia o código e devolve backup codes', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(`${API}/api/auth/2fa/setup/confirm/`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({ backup_codes: ['aaa', 'bbb'] })
    }))
    const r = await twoFactorService.confirmSetup('123456')
    expect(body).toEqual({ code: '123456' })
    expect(r.backup_codes).toHaveLength(2)
  })

  it('getTrustedDevices retorna a lista', async () => {
    server.use(http.get(`${API}/api/auth/2fa/trusted-devices/`, () => HttpResponse.json([
      { id: 1, user_agent: 'Chrome', created_at: 'x', last_used_at: null, expires_at: 'y' },
    ])))
    const d = await twoFactorService.getTrustedDevices()
    expect(d).toHaveLength(1)
    expect(d[0].id).toBe(1)
  })

  it('deleteTrustedDevice chama o endpoint do dispositivo', async () => {
    let hit = ''
    server.use(http.delete(`${API}/api/auth/2fa/trusted-devices/:id/`, ({ params }) => {
      hit = params.id as string
      return new HttpResponse(null, { status: 204 })
    }))
    await twoFactorService.deleteTrustedDevice(42)
    expect(hit).toBe('42')
  })

  it('challenge autentica e guarda o trusted device token', async () => {
    server.use(http.post(`${API}/api/auth/2fa/challenge/`, () => HttpResponse.json({
      access: 'access-tok',
      trusted_device_token: 'trust-tok',
      user: { id: 5, name: 'Alice', email: 'a@x.com', plan: 'free', date_joined: '2026-01-01' },
    })))
    const user = await twoFactorService.challenge('pending-tok', '123456', true)
    expect(user.name).toBe('Alice')
    expect(localStorage.getItem(TRUSTED_DEVICE_KEY)).toBe('trust-tok')
    expect(useAuthStore.getState().currentUser?.id).toBe('5')
  })
})
