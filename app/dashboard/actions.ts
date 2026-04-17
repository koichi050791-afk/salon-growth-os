'use server'

import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import { getMonthlyConfig } from '@/lib/repositories/monthly-configs'
import type { WeeklyStoreInput, WeeklyStaffInput, Staff, MonthlyConfig } from '@/lib/types/db'

export type DashboardData = {
  thisWeek: WeeklyStoreInput | null
  lastWeek: WeeklyStoreInput | null
  thisWeekStaff: WeeklyStaffInput[]
  lastWeekStaff: WeeklyStaffInput[]
  staffList: Staff[]
  config: MonthlyConfig | null
  error: string | null
}

function prevWeekISO(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export async function fetchDashboardData(
  storeId: string,
  weekStart: string
): Promise<DashboardData> {
  try {
    const lastWeekStart = prevWeekISO(weekStart)
    const month = weekStart.slice(0, 7)

    const [staffResult, thisWeek, lastWeek, thisWeekStaffResult, lastWeekStaffResult, configResult] =
      await Promise.all([
        getActiveStaffByStore(storeId),
        getWeeklyStoreInput(storeId, weekStart),
        getWeeklyStoreInput(storeId, lastWeekStart),
        getWeeklyStaffInputs(storeId, weekStart),
        getWeeklyStaffInputs(storeId, lastWeekStart),
        getMonthlyConfig(storeId, month),
      ])

    return {
      thisWeek: thisWeek ?? null,
      lastWeek: lastWeek ?? null,
      thisWeekStaff: thisWeekStaffResult.data,
      lastWeekStaff: lastWeekStaffResult.data,
      staffList: staffResult.data,
      config: configResult.data,
      error: null,
    }
  } catch (e) {
    return {
      thisWeek: null,
      lastWeek: null,
      thisWeekStaff: [],
      lastWeekStaff: [],
      staffList: [],
      config: null,
      error: String(e),
    }
  }
}
