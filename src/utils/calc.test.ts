import { describe, expect, it } from 'vitest'
import { calcTotalLiquido, groupByMonth, sumQuantidade, sumTotalLiquido, topClientesPorVolume } from './calc'

describe('calcTotalLiquido', () => {
  it('multiplies quantity by unit price', () => {
    expect(calcTotalLiquido(10, 150.5)).toBe(1505)
  })

  it('handles the retirada scenario (fractional quantity)', () => {
    expect(calcTotalLiquido(5, 80)).toBe(400)
  })

  it('rounds to 2 decimal places to avoid floating point drift', () => {
    expect(calcTotalLiquido(3, 33.333)).toBe(100)
    expect(calcTotalLiquido(0.1, 0.2)).toBe(0.02)
  })
})

describe('sumQuantidade / sumTotalLiquido', () => {
  const pedidos = [
    { quantidade_carga: 10, total_liquido: 900 },
    { quantidade_carga: 5, total_liquido: 400 },
  ]

  it('sums quantidade_carga across pedidos', () => {
    expect(sumQuantidade(pedidos)).toBe(15)
  })

  it('sums total_liquido across pedidos', () => {
    expect(sumTotalLiquido(pedidos)).toBe(1300)
  })

  it('returns 0 for an empty list', () => {
    expect(sumQuantidade([])).toBe(0)
    expect(sumTotalLiquido([])).toBe(0)
  })
})

describe('groupByMonth', () => {
  const reference = new Date(2026, 5, 30) // 30/06/2026

  it('fills in months with no pedidos as zero', () => {
    const buckets = groupByMonth([], 3, reference)
    expect(buckets).toHaveLength(3)
    expect(buckets.map((b) => b.month)).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(buckets.every((b) => b.vales === 0 && b.volume === 0 && b.valor === 0)).toBe(true)
  })

  it('aggregates pedidos into their month bucket', () => {
    const pedidos = [
      { created_at: '2026-06-05T12:00:00Z', quantidade_carga: 10, total_liquido: 900 },
      { created_at: '2026-06-20T12:00:00Z', quantidade_carga: 5, total_liquido: 400 },
      { created_at: '2026-05-10T12:00:00Z', quantidade_carga: 2, total_liquido: 60 },
    ]
    const buckets = groupByMonth(pedidos, 3, reference)
    const june = buckets.find((b) => b.month === '2026-06')!
    const may = buckets.find((b) => b.month === '2026-05')!
    expect(june).toMatchObject({ vales: 2, volume: 15, valor: 1300 })
    expect(may).toMatchObject({ vales: 1, volume: 2, valor: 60 })
  })

  it('ignores pedidos outside the requested range', () => {
    const pedidos = [{ created_at: '2025-01-01T00:00:00Z', quantidade_carga: 99, total_liquido: 99 }]
    const buckets = groupByMonth(pedidos, 2, reference)
    expect(buckets.every((b) => b.vales === 0)).toBe(true)
  })
})

describe('topClientesPorVolume', () => {
  const pedidos = [
    { empresa_nome: 'A', quantidade_carga: 10, total_liquido: 900 },
    { empresa_nome: 'B', quantidade_carga: 5, total_liquido: 400 },
    { empresa_nome: 'A', quantidade_carga: 8, total_liquido: 720 },
    { empresa_nome: 'C', quantidade_carga: 20, total_liquido: 1800 },
  ]

  it('ranks clients by total volume, descending', () => {
    const ranking = topClientesPorVolume(pedidos, 10)
    expect(ranking.map((r) => r.empresa_nome)).toEqual(['C', 'A', 'B'])
    expect(ranking[1]).toMatchObject({ vales: 2, volume: 18, valor: 1620 })
  })

  it('respects the limit', () => {
    expect(topClientesPorVolume(pedidos, 2)).toHaveLength(2)
  })

  it('returns an empty array for no pedidos', () => {
    expect(topClientesPorVolume([], 5)).toEqual([])
  })
})
