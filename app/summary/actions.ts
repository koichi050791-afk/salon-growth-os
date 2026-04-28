'use server'
import { createClient } from '@/lib/supabase/server'

export async function fetchSummaryData(storeId: string) {
  const supabase = await createClient()

  const { data: weeklyData } = await supabase
    .from('weekly_store_inputs')
    .select('week_start, sales, visits, availability_score, next_visit_count, total_labor_hours')
    .eq('store_id', storeId)
    .order('week_start', { ascending: true })
    .limit(8)

  const { data: actionData } = await supabase
    .from('improvement_actions')
    .select('week_start, action_title, status, result_status')
    .eq('store_id', storeId)
    .order('week_start', { ascending: true })
    .limit(8)

  const { data: staffData } = await supabase
    .from('weekly_staff_inputs')
    .select('week_start, staff_id, sales, labor_hours')
    .eq('store_id', storeId)
    .order('week_start', { ascending: true })
    .limit(32)

  return {
    weeklyData: weeklyData ?? [],
    actionData: actionData ?? [],
    staffData: staffData ?? []
  }
}
