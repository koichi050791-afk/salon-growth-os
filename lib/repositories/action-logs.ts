import { createClient } from '../supabase/server'
import type {
  ActionLog,
  ActionLogInsert,
  RepositoryResult,
} from '../types/db'

export async function getActionLog(
  staffId: string,
  weekDate: string
): Promise<RepositoryResult<ActionLog>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_logs')
    .select('*')
    .eq('staff_id', staffId)
    .eq('week_date', weekDate)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }
  return { data: data ?? null, error: error?.message ?? null }
}

export async function upsertActionLog(
  log: ActionLogInsert
): Promise<RepositoryResult<ActionLog>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_logs')
    .upsert(log, { onConflict: 'staff_id,week_date' })
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}
