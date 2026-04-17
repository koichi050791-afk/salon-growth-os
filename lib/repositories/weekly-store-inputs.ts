import { createClient } from '../supabase/server'
import type {
  WeeklyStoreInput,
  WeeklyStoreInputInsert,
  RepositoryListResult,
} from '../types/db'

export async function getWeeklyStoreInput(
  storeId: string,
  weekStart: string
): Promise<WeeklyStoreInput | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_store_inputs')
    .select('*')
    .eq('store_id', storeId)
    .eq('week_start', weekStart)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(error.message)
  return data
}

export async function upsertWeeklyStoreInput(
  data: WeeklyStoreInputInsert
): Promise<WeeklyStoreInput> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('weekly_store_inputs')
    .upsert(data, { onConflict: 'store_id,week_start' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result
}

export async function getStoreInputsByDateRange(
  storeId: string,
  from: string,
  to: string
): Promise<RepositoryListResult<WeeklyStoreInput>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_store_inputs')
    .select('*')
    .eq('store_id', storeId)
    .gte('week_start', from)
    .lte('week_start', to)
    .order('week_start', { ascending: true })

  return { data: data ?? [], error: error?.message ?? null }
}
