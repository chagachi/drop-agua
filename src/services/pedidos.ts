import { supabase } from '../lib/supabaseClient'
import type { Pedido } from '../types/database'
import type { PaginatedResult } from './empresas'

const PAGE_SIZE = 10

export async function countPedidos(): Promise<number> {
  const { count, error } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function listPedidos(page: number): Promise<PaginatedResult<Pedido>> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return { data: data ?? [], total, lastPage: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function searchPedidoById(id: number): Promise<Pedido[]> {
  const { data, error } = await supabase.from('pedidos').select('*').eq('id', id)
  if (error) throw error
  return data ?? []
}

export async function getPedido(id: number): Promise<Pedido> {
  const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createPedido(
  payload: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>
): Promise<Pedido> {
  const { data, error } = await supabase.from('pedidos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updatePedido(
  id: number,
  payload: Partial<Omit<Pedido, 'id' | 'created_at' | 'updated_at'>>
): Promise<Pedido> {
  const { data, error } = await supabase
    .from('pedidos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePedido(id: number): Promise<void> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) throw error
}

export async function listPedidosByRange(
  startDate: string,
  endDate: string,
  empresaId?: number,
  motoristaId?: number
): Promise<Pedido[]> {
  let query = supabase
    .from('pedidos')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('id', { ascending: false })

  if (empresaId) query = query.eq('empresa_id', empresaId)
  if (motoristaId) query = query.eq('motorista_id', motoristaId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
