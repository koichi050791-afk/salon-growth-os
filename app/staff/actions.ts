'use server'

import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import type { Staff, WeeklyStaffInput } from '@/lib/types/db'

export type StaffListData = {
  staffList: Staff[]
  thisWeekInputs: WeeklyStaffInput[]
  lastWeekInputs: WeeklyStaffInput[]
  error: string | null
}

function prevWeekISO(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export async function fetchStaffListData(
  storeId: string,
  weekStart: string
): Promise<StaffListData> {
  try {
    const lastWeek = prevWeekISO(weekStart)
    const [staffResult, thisWeekResult, lastWeekResult] = await Promise.all([
      getActiveStaffByStore(storeId),
      getWeeklyStaffInputs(storeId, weekStart),
      getWeeklyStaffInputs(storeId, lastWeek),
    ])
    return {
      staffList: staffResult.data,
      thisWeekInputs: thisWeekResult.data,
      lastWeekInputs: lastWeekResult.data,
      error: null,
    }
  } catch (e) {
    return { staffList: [], thisWeekInputs: [], lastWeekInputs: [], error: String(e) }
  }
}
