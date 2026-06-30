import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Sem throw aqui de propósito: um throw síncrono no escopo do módulo, com
  // build-time env vars ausentes, faz o minificador eliminar o restante do
  // bundle como código morto em vez de só falhar em runtime (bug observado
  // no Vite 8.1.1). O AuthProvider exibe um aviso de configuração em vez disso.
  console.error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas (.env.local ou variáveis de ambiente do Vercel).'
  )
}

// Tipagem genérica do cliente Supabase não usada aqui (ver src/types/database.ts
// para os tipos manuais usados nos services) — a inferência estrita do
// supabase-js v2.110 exige um shape de Database mais elaborado do que vale a
// pena manter manualmente; os services tipam request/response nas fronteiras.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
