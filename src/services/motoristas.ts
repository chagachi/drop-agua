import { supabase } from '../lib/supabaseClient'
import type { Motorista } from '../types/database'
import type { PaginatedResult } from './empresas'

const PAGE_SIZE = 10

export async function listMotoristas(page: number): Promise<PaginatedResult<Motorista>> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('motoristas')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('nome', { ascending: true })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return { data: data ?? [], total, lastPage: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function listMotoristasForSelect(): Promise<Motorista[]> {
  const { data, error } = await supabase
    .from('motoristas')
    .select('*')
    .eq('is_active', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getMotorista(id: number): Promise<Motorista> {
  const { data, error } = await supabase.from('motoristas').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createMotorista(
  payload: Omit<Motorista, 'id' | 'created_at' | 'updated_at'>
): Promise<Motorista> {
  const { data, error } = await supabase.from('motoristas').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateMotorista(
  id: number,
  payload: Partial<Omit<Motorista, 'id' | 'created_at' | 'updated_at'>>
): Promise<Motorista> {
  const { data, error } = await supabase
    .from('motoristas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateMotorista(id: number): Promise<void> {
  const { error } = await supabase.from('motoristas').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
