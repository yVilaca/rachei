import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw'
import api from './api'
import { useAuthStore } from '../stores/auth.store'

const API = 'http://localhost:8000'

describe('api — interceptor de request (Bearer)', () => {
  beforeEach(() => useAuthStore.getState().clearAuth())

  it('injeta o Authorization quando há accessToken', async () => {
    useAuthStore.setState({ accessToken: 'tok-123' })
    server.use(http.get(`${API}/api/ping/`, ({ request }) =>
      HttpResponse.json({ auth: request.headers.get('authorization') })))
    const { data } = await api.get('/api/ping/')
    expect(data.auth).toBe('Bearer tok-123')
  })

  it('não envia Authorization sem token', async () => {
    server.use(http.get(`${API}/api/ping/`, ({ request }) =>
      HttpResponse.json({ auth: request.headers.get('authorization') })))
    const { data } = await api.get('/api/ping/')
    expect(data.auth).toBeNull()
  })
})

describe('api — refresh no 401', () => {
  beforeEach(() => useAuthStore.setState({ accessToken: 'old', currentUser: null }))

  it('renova o token e repete a requisição original', async () => {
    let calls = 0
    server.use(
      http.get(`${API}/api/secure/`, ({ request }) => {
        calls += 1
        if (calls === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({ auth: request.headers.get('authorization') })
      }),
      http.post(`${API}/api/auth/refresh/`, () => HttpResponse.json({ access: 'new' })),
    )
    const { data } = await api.get('/api/secure/')
    expect(data.auth).toBe('Bearer new')          // repetiu com o token novo
    expect(useAuthStore.getState().accessToken).toBe('new')
  })

  it('deduplica 401s concorrentes num único refresh', async () => {
    let refreshCount = 0
    const seen: Record<string, number> = {}
    server.use(
      http.get(`${API}/api/secure/`, ({ request }) => {
        const t = request.headers.get('authorization') || 'none'
        seen[t] = (seen[t] || 0) + 1
        if (t !== 'Bearer new') return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({ ok: true })
      }),
      http.post(`${API}/api/auth/refresh/`, () => {
        refreshCount += 1
        return HttpResponse.json({ access: 'new' })
      }),
    )
    await Promise.all([api.get('/api/secure/'), api.get('/api/secure/'), api.get('/api/secure/')])
    expect(refreshCount).toBe(1) // um refresh só para os três 401 simultâneos
  })

  it('não tenta refresh em 401 de login (credencial inválida)', async () => {
    let refreshCount = 0
    server.use(
      http.post(`${API}/api/auth/login/`, () =>
        HttpResponse.json({ detail: 'senha' }, { status: 401 })),
      http.post(`${API}/api/auth/refresh/`, () => {
        refreshCount += 1
        return HttpResponse.json({ access: 'new' })
      }),
    )
    await expect(api.post('/api/auth/login/', {})).rejects.toBeTruthy()
    expect(refreshCount).toBe(0) // login errado não vira reload silencioso
  })
})

describe('api — falha do refresh encerra a sessão', () => {
  let originalLocation: Location
  const replace = vi.fn()

  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'old', currentUser: { id: '1' } as never })
    originalLocation = window.location
    // href válido: o axios lê window.location para resolver a origem da request.
    Object.defineProperty(window, 'location', {
      configurable: true, writable: true,
      value: { replace, assign: vi.fn(), href: 'http://localhost:3000/', origin: 'http://localhost:3000' },
    })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    replace.mockClear()
  })

  it('refresh que falha limpa o auth e manda para /login', async () => {
    server.use(
      http.get(`${API}/api/secure/`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API}/api/auth/refresh/`, () => new HttpResponse(null, { status: 401 })),
    )
    await expect(api.get('/api/secure/')).rejects.toBeTruthy()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(replace).toHaveBeenCalledWith('/login')
  })
})
