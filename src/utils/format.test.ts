import { describe, expect, it } from 'vitest'
import { formatCNPJ, formatCurrency, formatPhone } from './format'

describe('formatCNPJ', () => {
  it('formats a complete CNPJ', () => {
    expect(formatCNPJ('03111340000188')).toBe('03.111.340/0001-88')
  })

  it('strips non-digit characters before formatting', () => {
    expect(formatCNPJ('03.111.340/0001-88')).toBe('03.111.340/0001-88')
  })

  it('formats partial input progressively', () => {
    expect(formatCNPJ('0311134')).toBe('03.111.34')
  })

  it('ignores extra digits beyond 14', () => {
    expect(formatCNPJ('031113400001889999')).toBe('03.111.340/0001-88')
  })
})

describe('formatPhone', () => {
  it('formats an 11-digit mobile number', () => {
    expect(formatPhone('11973704943')).toBe('(11) 97370-4943')
  })

  it('formats a 10-digit landline number', () => {
    expect(formatPhone('1126497176')).toBe('(11) 2649-7176')
  })

  it('strips non-digit characters', () => {
    expect(formatPhone('(11) 97370-4943')).toBe('(11) 97370-4943')
  })
})

describe('formatCurrency', () => {
  it('formats a value as BRL currency', () => {
    expect(formatCurrency(90)).toBe('R$ 90,00')
  })

  it('formats values with cents', () => {
    expect(formatCurrency(1505.5)).toBe('R$ 1.505,50')
  })
})
