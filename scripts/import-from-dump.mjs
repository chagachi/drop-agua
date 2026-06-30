// Importa empresas, motoristas e placas a partir de um dump .sql (phpMyAdmin/
// mysqldump) do Trans-Água para o Supabase do Drop Água, via API REST
// autenticada como um usuário admin (não precisa de service role key nem de
// um servidor MySQL vivo). Pedidos NÃO são tocados.
//
// Uso:
//   1. Preencha scripts/.env.migration (veja scripts/.env.migration.example)
//      com SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DUMP_FILE.
//   2. node scripts/import-from-dump.mjs

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { extractTable } from './parse-sql-dump.mjs'
import { parseDecimal } from './decimal.mjs'

config({ path: resolve(import.meta.dirname, '.env.migration') })

const { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DUMP_FILE } = process.env

for (const [key, val] of Object.entries({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DUMP_FILE,
})) {
  if (!val) {
    console.error(`Variável ${key} não definida em scripts/.env.migration`)
    process.exit(1)
  }
}

function nullableText(value) {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str === '' ? null : str
}

async function login() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Login falhou: ${JSON.stringify(data)}`)
  return data.access_token
}

async function insertBatch(token, table, rows) {
  if (rows.length === 0) return { inserted: 0, error: null }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const text = await res.text()
    return { inserted: 0, error: text }
  }
  return { inserted: rows.length, error: null }
}

async function insertInChunks(token, table, rows, chunkSize = 200) {
  let inserted = 0
  const errors = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const result = await insertBatch(token, table, chunk)
    inserted += result.inserted
    if (result.error) errors.push(`linhas ${i}-${i + chunk.length}: ${result.error}`)
  }
  return { inserted, errors }
}

async function main() {
  console.log('Lendo dump:', DUMP_FILE)
  const sql = readFileSync(DUMP_FILE, 'utf8')

  const empresasRaw = extractTable(sql, 'cadastroempresas')
  const funcionariosRaw = extractTable(sql, 'funcionarios')
  const placasRaw = extractTable(sql, 'placas')

  console.log(
    `Encontrado no dump: ${empresasRaw.length} empresas, ${funcionariosRaw.length} motoristas, ${placasRaw.length} placas\n`
  )

  console.log('Autenticando como admin...')
  const token = await login()
  console.log('OK\n')

  // --- empresas ---
  const empresas = empresasRaw.map((row) => ({
    nome_fantasia: nullableText(row.nomefantasia) ?? `Empresa #${row.id}`,
    razao_social: nullableText(row.razaosocial),
    cnpj: nullableText(row.cnpj),
    ie: nullableText(row.ie),
    endereco_cobranca: nullableText(row.endereco),
    endereco_entrega: nullableText(row.endereco1),
    numero: nullableText(row.numero),
    bairro: nullableText(row.bairro),
    cidade: nullableText(row.cidade),
    estado: nullableText(row.estado)?.slice(0, 2) ?? null,
    telefone1: nullableText(row.telefone1),
    telefone2: nullableText(row.telefone2),
    email: nullableText(row.email),
    site: nullableText(row.site),
    valor_entrega: parseDecimal(row.valorfixo),
    valor_retirada: parseDecimal(row.valorretirada),
  }))
  console.log(`Importando ${empresas.length} empresas...`)
  const empresasResult = await insertInChunks(token, 'empresas', empresas)
  console.log(`  -> ${empresasResult.inserted}/${empresas.length} inseridas`)
  empresasResult.errors.forEach((e) => console.log('  ERRO:', e))

  // --- motoristas ---
  const motoristas = funcionariosRaw.map((row) => ({
    nome: nullableText(row.nome) ?? `Motorista #${row.id}`,
    telefone: nullableText(row.telefone),
    celular: nullableText(row.celular),
    is_active: String(row.status) === '0',
  }))
  console.log(`\nImportando ${motoristas.length} motoristas...`)
  const motoristasResult = await insertInChunks(token, 'motoristas', motoristas)
  console.log(`  -> ${motoristasResult.inserted}/${motoristas.length} inseridos`)
  motoristasResult.errors.forEach((e) => console.log('  ERRO:', e))

  // --- placas (dedupe) ---
  const seen = new Set()
  const placas = []
  const placasSkipped = []
  for (const row of placasRaw) {
    const placa = nullableText(row.placas)?.toUpperCase()
    if (!placa) {
      placasSkipped.push(`id=${row.id}: valor vazio`)
      continue
    }
    if (seen.has(placa)) {
      placasSkipped.push(`id=${row.id} (${placa}): duplicada`)
      continue
    }
    seen.add(placa)
    placas.push({ placa })
  }
  console.log(`\nImportando ${placas.length} placas...`)
  const placasResult = await insertInChunks(token, 'placas', placas)
  console.log(`  -> ${placasResult.inserted}/${placas.length} inseridas`)
  placasResult.errors.forEach((e) => console.log('  ERRO:', e))
  placasSkipped.forEach((s) => console.log('  IGNORADA:', s))

  console.log('\n=== RESUMO ===')
  console.log(`Empresas: ${empresasResult.inserted}/${empresas.length}`)
  console.log(`Motoristas: ${motoristasResult.inserted}/${motoristas.length}`)
  console.log(`Placas: ${placasResult.inserted}/${placas.length}`)
}

main().catch((err) => {
  console.error('Falha na importação:', err)
  process.exit(1)
})
