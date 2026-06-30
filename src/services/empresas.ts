import { supabase } from '../lib/supabaseClient'
import type { Empresa } from '../types/database'

const PAGE_SIZE = 10

export interface PaginatedResult<T> {
  data: T[]
  total: number
  lastPage: number
}

export async function listEmpresas(page: number): Promise<PaginatedResult<Empresa>> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('empresas')
    .select('*', { count: 'exact' })
    .order('nome_fantasia', { ascending: true })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return { data: data ?? [], total, lastPage: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function searchEmpresasByNome(nome: string): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .ilike('nome_fantasia', `%${nome}%`)
    .order('nome_fantasia', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function searchEmpresaByCnpj(cnpj: string): Promise<Empresa[]> {
  const { data, error } = await supabase.from('empresas').select('*').eq('cnpj', cnpj)
  if (error) throw error
  return data ?? []
}

export async function listEmpresasForSelect(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nome_fantasia', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getEmpresa(id: number): Promise<Empresa> {
  const { data, error } = await supabase.from('empresas').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createEmpresa(
  payload: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>
): Promise<Empresa> {
  const { data, error } = await supabase.from('empresas').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateEmpresa(
  id: number,
  payload: Partial<Omit<Empresa, 'id' | 'created_at' | 'updated_at'>>
): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEmpresa(id: number): Promise<void> {
  const { error } = await supabase.from('empresas').delete().eq('id', id)
  if (error) throw error
}

export async function countEmpresas(): Promise<number> {
  const { count, error } = await supabase
    .from('empresas')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}
