import { createClient } from '../supabase/server'
import type {
  MonthlyConfig,
  MonthlyConfigInsert,
  MonthlyConfigUpdate,
  RepositoryResult,
  RepositoryListResult,
} from '../types/db'

export async function getMonthlyConfigsByStore(
  storeId: string
): Promise<RepositoryListResult<MonthlyConfig>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_configs')
    .select('*')
    .eq('store_id', storeId)
    .order('target_month', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getMonthlyConfig(
  storeId: string,
  targetMonth: string
): Promise<RepositoryResult<MonthlyConfig>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_configs')
    .select('*')
    .eq('store_id', storeId)
    .eq('target_month', targetMonth)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }
  return { data: data ?? null, error: error?.message ?? null }
}

export async function getLatestMonthlyConfig(
  storeId: string
): Promise<RepositoryResult<MonthlyConfig>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_configs')
    .select('*')
    .eq('store_id', storeId)
    .order('target_month', { ascending: false })
    .limit(1)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }
  return { data: data ?? null, error: error?.message ?? null }
}

export async function upsertMonthlyConfig(
  config: MonthlyConfigInsert
): Promise<RepositoryResult<MonthlyConfig>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_configs')
    .upsert(config, { onConflict: 'store_id,target_month' })
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function updateMonthlyConfig(
  id: string,
  updates: MonthlyConfigUpdate
): Promise<RepositoryResult<MonthlyConfig>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('monthly_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function deleteMonthlyConfig(id: string): Promise<RepositoryResult<null>> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('monthly_configs')
    .delete()
    .eq('id', id)
  return { data: null, error: error?.message ?? null }
}
