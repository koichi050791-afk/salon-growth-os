'use server'

import { getActiveStaffByStore } from '@/lib/repositories/staff'
import { getWeeklyStoreInput, getLatestWeeklyStoreInput, getStoreInputsByDateRange } from '@/lib/repositories/weekly-store-inputs'
import { getWeeklyStaffInputs } from '@/lib/repositories/weekly-staff-inputs'
import { getMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getRecentImprovementActions } from '@/lib/repositories/improvement-actions'
import { calcProratedMonthlySales } from '@/lib/calculations'
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
  completedWeeks: number
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

export async function fetchLatestWeekStart(storeId: string): Promise<string | null> {
  try {
    const input = await getLatestWeeklyStoreInput(storeId)
    return input?.week_start ?? null
  } catch {
    return null
  }
}

export async function fetchDashboardData(
  storeId: string,
  weekStart: string
): Promise<DashboardData> {
  try {
    const lastWeekStart = prevWeekISO(weekStart)
    const fourWeeksAgoISO = nWeeksAgoISO(weekStart, 3)
    const month = weekStart.slice(0, 7)

    // 月初の7日前（前月末にまたがる週を取得するため）
    const monthFetchStart = new Date(weekStart.slice(0, 8) + '01')
    monthFetchStart.setDate(monthFetchStart.getDate() - 7)
    const monthFetchStartISO = monthFetchStart.toISOString().slice(0, 10)

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
        getStoreInputsByDateRange(storeId, monthFetchStartISO, weekStart),
      ])

    // 直近4週分をマージ
    const history: HistoryWeek[] = [0, 1, 2, 3].map((i) => {
      const ws = nWeeksAgoISO(weekStart, i)
      const input = historyInputs.data.find((x) => x.week_start === ws) ?? null
      const action = historyActions.data.find((x) => x.week_start === ws) ?? null
      return { weekStart: ws, input, action }
    })

    // 月累計売上・入力済み週数（按分方式）
    const monthlySales = calcProratedMonthlySales(monthlyInputsResult.data, month)

    const completedWeeks = monthlyInputsResult.data.filter((w) => {
      if (w.sales === null) return false
      const weekStartDate = new Date(w.week_start)
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 6)
      const [year, m] = month.split('-').map(Number)
      const monthStart = new Date(year, m - 1, 1)
      const monthEnd = new Date(year, m, 0)
      return weekEndDate >= monthStart && weekStartDate <= monthEnd
    }).length

    return {
      thisWeek: thisWeek ?? null,
      lastWeek: lastWeek ?? null,
      thisWeekStaff: thisWeekStaffResult.data,
      lastWeekStaff: lastWeekStaffResult.data,
      staffList: staffResult.data,
      config: configResult.data,
      history,
      monthlySales,
      completedWeeks,
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
      completedWeeks: 0,
      error: String(e),
    }
  }
}
