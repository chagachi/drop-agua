// Parser de valores monetários vindos do dump MySQL (string, formato variável).
// Histórico: a primeira versão removia todo '.' assumindo separador de milhar,
// o que inflava valores como "90.00" (decimal com ponto) para 9000. Ver
// scripts/decimal.test.mjs para o teste de regressão desse caso específico.
export function parseDecimal(value) {
  if (value === null || value === undefined) return 0
  let str = String(value).trim()
  if (str === '') return 0
  // Só trata '.' como separador de milhar quando há ',' como separador decimal
  // (formato BR "1.234,56"); senão o '.' já é o ponto decimal ("25.93").
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.')
  }
  const n = Number.parseFloat(str)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}
