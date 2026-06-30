import { describe, expect, it } from 'vitest'
import { parseDecimal } from './decimal.mjs'

describe('parseDecimal', () => {
  // Regressão: bug real de produção — "90.00" virou 9000 porque a primeira
  // versão removia todo '.' assumindo separador de milhar.
  it('treats a lone dot as the decimal separator, not a thousands separator', () => {
    expect(parseDecimal('90.00')).toBe(90)
    expect(parseDecimal('25.9259259259')).toBe(25.93)
    expect(parseDecimal('23.00')).toBe(23)
  })

  it('treats comma as the decimal separator and dot as thousands when both are present', () => {
    expect(parseDecimal('1.234,56')).toBe(1234.56)
    expect(parseDecimal('35,00')).toBe(35)
  })

  it('returns 0 for null, undefined or empty values', () => {
    expect(parseDecimal(null)).toBe(0)
    expect(parseDecimal(undefined)).toBe(0)
    expect(parseDecimal('')).toBe(0)
    expect(parseDecimal('   ')).toBe(0)
  })

  it('returns 0 for non-numeric garbage instead of throwing', () => {
    expect(parseDecimal('não tem')).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    expect(parseDecimal('23.3333333333333')).toBe(23.33)
  })
})
