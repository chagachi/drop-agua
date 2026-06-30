import { supabase } from '../lib/supabaseClient'
import type { Placa } from '../types/database'
import type { PaginatedResult } from './empresas'

const PAGE_SIZE = 10

export async function listPlacas(page: number): Promise<PaginatedResult<Placa>> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('placas')
    .select('*', { count: 'exact' })
    .order('placa', { ascending: true })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return { data: data ?? [], total, lastPage: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function listPlacasForSelect(): Promise<Placa[]> {
  const { data, error } = await supabase.from('placas').select('*').order('placa', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createPlaca(placa: string): Promise<Placa> {
  const { data, error } = await supabase.from('placas').insert({ placa }).select().single()
  if (error) throw error
  return data
}

export async function deletePlaca(id: number): Promise<void> {
  const { error } = await supabase.from('placas').delete().eq('id', id)
  if (error) throw error
}
