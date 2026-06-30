import { supabase } from '../lib/supabaseClient'

export async function countPedidos(): Promise<number> {
  const { count, error } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}
