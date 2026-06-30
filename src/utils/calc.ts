export function calcTotalLiquido(quantidadeCarga: number, valorUnitario: number): number {
  return Math.round(quantidadeCarga * valorUnitario * 100) / 100
}

export function sumQuantidade<T extends { quantidade_carga: number }>(pedidos: T[]): number {
  return pedidos.reduce((sum, p) => sum + p.quantidade_carga, 0)
}

export function sumTotalLiquido<T extends { total_liquido: number }>(pedidos: T[]): number {
  return pedidos.reduce((sum, p) => sum + p.total_liquido, 0)
}

interface MonthlyBucket {
  month: string
  label: string
  vales: number
  volume: number
  valor: number
}

/** Agrupa pedidos por mês (chave "AAAA-MM"), preenchendo meses sem vales com zero. */
export function groupByMonth<
  T extends { created_at: string; quantidade_carga: number; total_liquido: number },
>(pedidos: T[], monthsBack: number, referenceDate = new Date()): MonthlyBucket[] {
  const buckets = new Map<string, MonthlyBucket>()
  const monthLabels = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, {
      month: key,
      label: `${monthLabels[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      vales: 0,
      volume: 0,
      valor: 0,
    })
  }

  for (const p of pedidos) {
    const d = new Date(p.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.vales += 1
    bucket.volume += p.quantidade_carga
    bucket.valor += p.total_liquido
  }

  return Array.from(buckets.values())
}

interface ClienteRanking {
  empresa_nome: string
  vales: number
  volume: number
  valor: number
}

/** Ranking dos clientes com mais volume, do maior pro menor. */
export function topClientesPorVolume<
  T extends { empresa_nome: string; quantidade_carga: number; total_liquido: number },
>(pedidos: T[], limit: number): ClienteRanking[] {
  const byClient = new Map<string, ClienteRanking>()

  for (const p of pedidos) {
    const existing = byClient.get(p.empresa_nome) ?? {
      empresa_nome: p.empresa_nome,
      vales: 0,
      volume: 0,
      valor: 0,
    }
    existing.vales += 1
    existing.volume += p.quantidade_carga
    existing.valor += p.total_liquido
    byClient.set(p.empresa_nome, existing)
  }

  return Array.from(byClient.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
}
