// Importação única de empresas, motoristas e placas do MySQL do Trans-Água para o
// Supabase Postgres do Drop Água. NÃO toca pedidos (começam vazios por decisão do usuário).
//
// Uso:
//   1. Copie scripts/.env.migration.example para scripts/.env.migration e preencha.
//   2. npx tsx scripts/migrate-data.ts
//
// Usa a service role key do Supabase (bypassa RLS) — nunca usar essa chave no app cliente.

import mysql from 'mysql2/promise'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(import.meta.dirname, '.env.migration') })

const required = [
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
  'MYSQL_DATABASE',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Variável ${key} não definida em scripts/.env.migration`)
    process.exit(1)
  }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function parseDecimal(value: unknown): number {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).trim().replace(/\./g, '').replace(',', '.')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  return str === '' ? null : str
}

async function migrateEmpresas(conn: mysql.Connection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT * FROM cadastroempresas')

  let inserted = 0
  const skipped: string[] = []

  for (const row of rows) {
    const payload = {
      nome_fantasia: nullableText(row.nomefantasia) ?? `Empresa #${row.id}`,
      razao_social: nullableText(row.razaosocial),
      cnpj: nullableText(row.cnpj),
      ie: nullableText(row.ie),
      endereco_cobranca: nullableText(row.endereco),
      endereco_entrega: nullableText(row.endereco1),
      numero: nullableText(row.numero),
      bairro: nullableText(row.bairro),
      cidade: nullableText(row.cidade),
      estado: nullableText(row.estado),
      telefone1: nullableText(row.telefone1),
      telefone2: nullableText(row.telefone2),
      email: nullableText(row.email),
      site: nullableText(row.site),
      valor_entrega: parseDecimal(row.valorfixo),
      valor_retirada: parseDecimal(row.valorretirada),
    }

    const { error } = await supabase.from('empresas').insert(payload)
    if (error) {
      skipped.push(`empresa id=${row.id} (${payload.nome_fantasia}): ${error.message}`)
      continue
    }
    inserted++
  }

  return { total: rows.length, inserted, skipped }
}

async function migrateMotoristas(conn: mysql.Connection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT * FROM funcionarios')

  let inserted = 0
  const skipped: string[] = []

  for (const row of rows) {
    const payload = {
      nome: nullableText(row.nome) ?? `Motorista #${row.id}`,
      telefone: nullableText(row.telefone),
      celular: nullableText(row.celular),
      is_active: String(row.status) === '0',
    }

    const { error } = await supabase.from('motoristas').insert(payload)
    if (error) {
      skipped.push(`motorista id=${row.id} (${payload.nome}): ${error.message}`)
      continue
    }
    inserted++
  }

  return { total: rows.length, inserted, skipped }
}

async function migratePlacas(conn: mysql.Connection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT * FROM placas')

  const seen = new Set<string>()
  let inserted = 0
  const skipped: string[] = []

  for (const row of rows) {
    const placa = nullableText(row.placa)?.toUpperCase()
    if (!placa) {
      skipped.push(`placa id=${row.id}: valor vazio`)
      continue
    }
    if (seen.has(placa)) {
      skipped.push(`placa id=${row.id} (${placa}): duplicada, já importada`)
      continue
    }
    seen.add(placa)

    const { error } = await supabase.from('placas').insert({ placa })
    if (error) {
      skipped.push(`placa id=${row.id} (${placa}): ${error.message}`)
      continue
    }
    inserted++
  }

  return { total: rows.length, inserted, skipped }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })

  console.log('Conectado ao MySQL. Iniciando importação (empresas, motoristas, placas)...\n')

  const results = {
    empresas: await migrateEmpresas(conn),
    motoristas: await migrateMotoristas(conn),
    placas: await migratePlacas(conn),
  }

  await conn.end()

  for (const [table, result] of Object.entries(results)) {
    console.log(`\n${table}: ${result.inserted}/${result.total} importados`)
    if (result.skipped.length > 0) {
      console.log(`  ${result.skipped.length} ignorados:`)
      result.skipped.forEach((msg) => console.log(`    - ${msg}`))
    }
  }
}

main().catch((err) => {
  console.error('Falha na importação:', err)
  process.exit(1)
})
