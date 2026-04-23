'use server'

import { revalidatePath } from 'next/cache'
import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStoreInput, upsertWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getWeeklyStaffInputs, upsertWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getImprovementActionByWeek, updateImprovementAction } from '@/lib/repositories/improvement-actions'
import { logAudit } from '@/lib/repositories/audit-logs'
import type { Staff, WeeklyStoreInput, WeeklyStaffInput, MonthlyConfig, ImprovementAction } from '@/lib/types/db'

function prevWeekISO(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

// ──────────────────────────────────────────────
// データ取得
// ──────────────────────────────────────────────
export type WeeklyDataResult = {
  staff: Staff[]
  storeInput: WeeklyStoreInput | null
  lastWeekInput: WeeklyStoreInput | null
  staffInputs: WeeklyStaffInput[]
  config: MonthlyConfig | null
  prevAction: ImprovementAction | null
  error: string | null
}

export async function fetchWeeklyData(
  storeId: string,
  weekStart: string
): Promise<WeeklyDataResult> {
  try {
    const lastWeekStart = prevWeekISO(weekStart)

    const [staffResult, storeInput, lastWeekInput, staffInputsResult, configResult, prevAction] =
      await Promise.all([
        getActiveStaffByStore(storeId),
        getWeeklyStoreInput(storeId, weekStart),
        getWeeklyStoreInput(storeId, lastWeekStart),
        getWeeklyStaffInputs(storeId, weekStart),
        getLatestMonthlyConfig(storeId),
        getImprovementActionByWeek(storeId, lastWeekStart),
      ])

    return {
      staff: staffResult.data,
      storeInput: storeInput ?? null,
      lastWeekInput: lastWeekInput ?? null,
      staffInputs: staffInputsResult.data,
      config: configResult.data,
      prevAction: prevAction ?? null,
      error: null,
    }
  } catch (e) {
    return { staff: [], storeInput: null, lastWeekInput: null, staffInputs: [], config: null, prevAction: null, error: String(e) }
  }
}

// ──────────────────────────────────────────────
// 一括保存
// ──────────────────────────────────────────────
export type StoreInputPayload = {
  store_id: string
  week_start: string
  sales: number | null
  visits: number | null
  next_visit_count: number | null
  new_customers: number | null
  repeat_customers: number | null
  availability_score: number | null
  memo: string | null
  total_labor_hours: number | null
}

export type StaffInputPayload = {
  store_id: string
  staff_id: string
  week_start: string
  sales: number | null
  visits: number | null
  labor_hours: number | null
}

export async function saveWeeklyInputs(
  storePayload: StoreInputPayload,
  staffPayloads: StaffInputPayload[]
): Promise<{ error: string | null }> {
  try {
    await upsertWeeklyStoreInput(storePayload)
    if (staffPayloads.length > 0) {
      await upsertWeeklyStaffInputs(staffPayloads)
    }
    await logAudit({ action: 'upsert', table_name: 'weekly_store_inputs', new_data: storePayload })
    if (staffPayloads.length > 0) {
      await logAudit({ action: 'upsert', table_name: 'weekly_staff_inputs', new_data: staffPayloads })
    }
    revalidatePath('/dashboard')
    revalidatePath('/')
    return { error: null }
  } catch (e) {
    console.error('saveWeeklyInputs error:', e)
    return { error: 'エラーが発生しました' }
  }
}

export async function savePrevActionResult(
  actionId: string,
  resultStatus: 'improved' | 'unchanged' | 'worsened',
  resultNote: string,
  nextDecision: 'continue' | 'switch',
): Promise<{ error: string | null }> {
  try {
    await updateImprovementAction(actionId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_status: resultStatus,
      result_note: resultNote || null,
      next_decision: nextDecision,
    })
    revalidatePath('/actions')
    revalidatePath('/')
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}
