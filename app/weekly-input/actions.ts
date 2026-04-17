'use server'

import { revalidatePath } from 'next/cache'
import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStoreInput, upsertWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getWeeklyStaffInputs, upsertWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import type { Staff, WeeklyStoreInput, WeeklyStaffInput } from '@/lib/types/db'

// ──────────────────────────────────────────────
// データ取得（店舗・週選択時に呼ぶ）
// ──────────────────────────────────────────────
export type WeeklyDataResult = {
  staff: Staff[]
  storeInput: WeeklyStoreInput | null
  staffInputs: WeeklyStaffInput[]
  error: string | null
}

export async function fetchWeeklyData(
  storeId: string,
  weekStart: string
): Promise<WeeklyDataResult> {
  try {
    const [staffResult, storeInput, staffInputsResult] = await Promise.all([
      getActiveStaffByStore(storeId),
      getWeeklyStoreInput(storeId, weekStart),
      getWeeklyStaffInputs(storeId, weekStart),
    ])
    return {
      staff: staffResult.data,
      storeInput: storeInput ?? null,
      staffInputs: staffInputsResult.data,
      error: null,
    }
  } catch (e) {
    return { staff: [], storeInput: null, staffInputs: [], error: String(e) }
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
}

export type StaffInputPayload = {
  store_id: string
  staff_id: string
  week_start: string
  sales: number | null
  visits: number | null
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
    revalidatePath('/dashboard')
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}
