import { describe, it, expect } from 'vitest'
import { formatCurrency, getInitials } from './utils'

describe('formatCurrency', () => {
  it('converte centavos para reais BRL', () => {
    const out = formatCurrency(22500)
    expect(out).toContain('225,00')
    expect(out).toMatch(/R\$/)
  })

  it('trata zero e valores pequenos', () => {
    expect(formatCurrency(0)).toContain('0,00')
    expect(formatCurrency(5)).toContain('0,05')
  })
})

describe('getInitials', () => {
  it('usa as duas primeiras palavras', () => {
    expect(getInitials('Lucas Vilaça')).toBe('LV')
    expect(getInitials('joão pedro silva')).toBe('JP')
  })

  it('trata nome único', () => {
    expect(getInitials('Ana')).toBe('A')
  })
})
