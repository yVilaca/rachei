import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import { authService } from './auth.service'

const API = 'http://localhost:8000'

describe('authService.updateProfile', () => {
  it('mapeia name + prefs para snake_case e retorna o user atualizado', async () => {
    let captured: Record<string, unknown> | null = null
    server.use(http.patch(`${API}/api/auth/me/`, async ({ request }) => {
      captured = (await request.json()) as Record<string, unknown>
      return HttpResponse.json({
        id: 1, name: 'Maria Silva', email: 'm@example.invalid', plan: 'free',
        date_joined: '2026-01-01T00:00:00Z', avatar_url: '',
        notif_cobracas: false, notif_confirmacoes: true, notif_lembretes: false,
      })
    }))

    const user = await authService.updateProfile({ name: 'Maria Silva', notifCobrancas: false })

    expect(captured).toEqual({ name: 'Maria Silva', notif_cobracas: false })
    expect(user.name).toBe('Maria Silva')
    expect(user.notifCobrancas).toBe(false)
    expect(user.notifConfirmacoes).toBe(true)
  })
})
