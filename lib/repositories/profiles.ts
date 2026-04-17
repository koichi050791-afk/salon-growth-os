import { createClient } from '../supabase/server'
import type { Profile, RepositoryResult } from '../types/db'

export async function getProfileById(userId: string): Promise<RepositoryResult<Profile>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }
  return { data: data ?? null, error: error?.message ?? null }
}

export async function getServerProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ?? null
}
