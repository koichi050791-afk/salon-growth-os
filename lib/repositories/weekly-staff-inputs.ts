import { createClient } from '../supabase/server'
import type {
  WeeklyStaffInput,
  WeeklyStaffInputInsert,
  RepositoryListResult,
} from '../types/db'

export async function getWeeklyStaffInputs(
  storeId: string,
  weekStart: string
): Promise<RepositoryListResult<WeeklyStaffInput>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_staff_inputs')
    .select('*')
    .eq('store_id', storeId)
    .eq('week_start', weekStart)
    .order('staff_id', { ascending: true })

  return { data: data ?? [], error: error?.message ?? null }
}

export async function upsertWeeklyStaffInputs(
  inputs: WeeklyStaffInputInsert[]
): Promise<RepositoryListResult<WeeklyStaffInput>> {
  if (inputs.length === 0) return { data: [], error: null }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_staff_inputs')
    .upsert(inputs, { onConflict: 'staff_id,week_start' })
    .select()

  return { data: data ?? [], error: error?.message ?? null }
}

export async function getStaffInputsByDateRange(
  staffId: string,
  from: string,
  to: string
): Promise<RepositoryListResult<WeeklyStaffInput>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('weekly_staff_inputs')
    .select('*')
    .eq('staff_id', staffId)
    .gte('week_start', from)
    .lte('week_start', to)
    .order('week_start', { ascending: true })

  return { data: data ?? [], error: error?.message ?? null }
}
