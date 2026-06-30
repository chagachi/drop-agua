import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('email', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function updateProfile(
  id: string,
  payload: Partial<Pick<Profile, 'is_admin' | 'is_active'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
