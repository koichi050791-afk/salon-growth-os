'use server'

import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStoreInput, getStoreInputsByDateRange } from '@/lib/repositories/weekly-store-inputs'
import { getWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import { getMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getRecentImprovementActions } from '@/lib/repositories/improvement-actions'
import type { WeeklyStoreInput, WeeklyStaffInput, Staff, MonthlyConfig, ImprovementAction } from '@/lib/types/db'

export type HistoryWeek = {
  weekStart: string
  input: WeeklyStoreInput | null
  action: ImprovementAction | null
}

export type DashboardData = {
  thisWeek: WeeklyStoreInput | null
  lastWeek: WeeklyStoreInput | null
  thisWeekStaff: WeeklyStaffInput[]
  lastWeekStaff: WeeklyStaffInput[]
  staffList: Staff[]
  config: MonthlyConfig | null
  history: HistoryWeek[]
  monthlySales: number | null
  error: string | null
}

function prevWeekISO(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function nWeeksAgoISO(weekStart: string, n: number): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7 * n)
  return d.toISOString().slice(0, 10)
}

export async function fetchDashboardData(
  storeId: string,
  weekStart: string
): Promise<DashboardData> {
  try {
    const lastWeekStart = prevWeekISO(weekStart)
    const fourWeeksAgoISO = nWeeksAgoISO(weekStart, 3)
    const month = weekStart.slice(0, 7)
    const monthStart = weekStart.slice(0, 8) + '01'

    const [staffResult, thisWeek, lastWeek, thisWeekStaffResult, lastWeekStaffResult, configResult, historyInputs, historyActions, monthlyInputsResult] =
      await Promise.all([
        getActiveStaffByStore(storeId),
        getWeeklyStoreInput(storeId, weekStart),
        getWeeklyStoreInput(storeId, lastWeekStart),
        getWeeklyStaffInputs(storeId, weekStart),
        getWeeklyStaffInputs(storeId, lastWeekStart),
        getMonthlyConfig(storeId, month),
        getStoreInputsByDateRange(storeId, fourWeeksAgoISO, weekStart),
        getRecentImprovementActions(storeId, 4),
        getStoreInputsByDateRange(storeId, monthStart, weekStart),
      ])

    // 直近4週分をマージ
    const history: HistoryWeek[] = [0, 1, 2, 3].map((i) => {
      const ws = nWeeksAgoISO(weekStart, i)
      const input = historyInputs.data.find((x) => x.week_start === ws) ?? null
      const action = historyActions.data.find((x) => x.week_start === ws) ?? null
      return { weekStart: ws, input, action }
    })

    // 月累計売上
    const monthlySalesArr = monthlyInputsResult.data
      .map((i) => i.sales)
      .filter((s): s is number => s !== null)
    const monthlySales = monthlySalesArr.length > 0
      ? monthlySalesArr.reduce((a, b) => a + b, 0)
      : null

    return {
      thisWeek: thisWeek ?? null,
      lastWeek: lastWeek ?? null,
      thisWeekStaff: thisWeekStaffResult.data,
      lastWeekStaff: lastWeekStaffResult.data,
      staffList: staffResult.data,
      config: configResult.data,
      history,
      monthlySales,
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
      history: [],
      monthlySales: null,
      error: String(e),
    }
  }
}
