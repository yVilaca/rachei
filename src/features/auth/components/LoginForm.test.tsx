import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/msw'
import LoginForm from './LoginForm'

const API = 'http://localhost:8000'

function setup() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm onSwitchToRegister={() => {}} />} />
        <Route path="/dashboard" element={<div>PAINEL</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginForm', () => {
  it('valida campos vazios antes de enviar', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Preencha todos os campos')).toBeInTheDocument()
  })

  it('mostra erro quando as credenciais são inválidas (401)', async () => {
    server.use(http.post(`${API}/api/auth/login/`, () =>
      HttpResponse.json({ detail: 'E-mail ou senha incorretos' }, { status: 401 })))
    setup()
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'a@x.com')
    await userEvent.type(screen.getByPlaceholderText('Sua senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('E-mail ou senha incorretos')).toBeInTheDocument()
  })

  it('login válido navega para o dashboard', async () => {
    server.use(http.post(`${API}/api/auth/login/`, () => HttpResponse.json({
      access: 'tok',
      user: { id: 1, name: 'Alice', email: 'a@x.com', plan: 'free', date_joined: '2026-01-01' },
    })))
    setup()
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'a@x.com')
    await userEvent.type(screen.getByPlaceholderText('Sua senha'), 'Zx9kLmnQ7er')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('PAINEL')).toBeInTheDocument()
  })
})
