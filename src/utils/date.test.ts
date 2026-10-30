import { beforeAll, describe, expect, it, vi } from 'vitest'
import { endOfDayISO, startOfDayISO, toDateInput, toDateTimeInput } from './date'

beforeAll(() => {
  // Fixa o fuso de Brasília (UTC-3) para os testes não dependerem da máquina
  vi.stubEnv('TZ', 'America/Sao_Paulo')
})

describe('startOfDayISO / endOfDayISO', () => {
  it('starts the period at local midnight, not UTC midnight', () => {
    // Regressão: o relatório "de 01/10" começava em 30/09 às 21h
    expect(startOfDayISO('2026-10-01')).toBe('2026-10-01T03:00:00.000Z')
  })

  it('ends the period at the last millisecond of the local day', () => {
    expect(endOfDayISO('2026-10-30')).toBe('2026-10-31T02:59:59.999Z')
  })
})

describe('toDateTimeInput', () => {
  it('shows the stored UTC timestamp in local time', () => {
    // Regressão: um vale de 30/09 às 22h aparecia na edição como 01/10 01:00
    expect(toDateTimeInput('2026-10-01T01:00:00+00:00')).toBe('2026-09-30T22:00')
  })

  it('round-trips through the form without shifting the date', () => {
    const stored = '2026-09-30T13:45:00.000Z'
    expect(new Date(toDateTimeInput(stored)).toISOString()).toBe(stored)
  })
})

describe('toDateInput', () => {
  it('uses the local date late in the evening', () => {
    // Regressão: o atalho "Hoje" após as 21h já pegava o dia seguinte
    expect(toDateInput(new Date('2026-10-30T23:30:00-03:00'))).toBe('2026-10-30')
  })
})
