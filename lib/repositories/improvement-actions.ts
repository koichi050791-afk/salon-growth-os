import { createClient } from '../supabase/server'
import type { ImprovementAction, ImprovementActionInsert, ImprovementActionUpdate, RepositoryResult, RepositoryListResult } from '@/lib/types/db'

export async function getImprovementActionByWeek(
  storeId: string,
  weekStart: string,
): Promise<ImprovementAction | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('improvement_actions')
    .select('*')
    .eq('store_id', storeId)
    .eq('week_start', weekStart)
    .maybeSingle()
  return data ?? null
}

export async function getRecentImprovementActions(
  storeId: string,
  limit = 4,
): Promise<RepositoryListResult<ImprovementAction>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('improvement_actions')
    .select('*')
    .eq('store_id', storeId)
    .order('week_start', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error: error?.message ?? null }
}

export async function upsertImprovementAction(
  payload: ImprovementActionInsert,
): Promise<RepositoryResult<ImprovementAction>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('improvement_actions')
    .upsert(payload, { onConflict: 'store_id,week_start' })
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function updateImprovementAction(
  id: string,
  update: ImprovementActionUpdate,
): Promise<RepositoryResult<ImprovementAction>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('improvement_actions')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function getLatestImprovementAction(
  storeId: string,
): Promise<ImprovementAction | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('improvement_actions')
    .select('*')
    .eq('store_id', storeId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}
