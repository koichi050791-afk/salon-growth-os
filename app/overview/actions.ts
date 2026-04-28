'use server'

import { getActiveStores } from '@/lib/repositories/stores'
import { getWeeklyStoreInput, getStoreInputsByDateRange } from '@/lib/repositories/weekly-store-inputs'
import { getMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { calcProratedMonthlySales } from '@/lib/calculations'
import type { Store, WeeklyStoreInput, MonthlyConfig } from '@/lib/types/db'

export type StoreOverview = {
  store: Store
  thisWeek: WeeklyStoreInput | null
  lastWeek: WeeklyStoreInput | null
  config: MonthlyConfig | null
  monthlySales: number | null
  completedWeeks: number
}

export type OverviewData = {
  stores: StoreOverview[]
  error: string | null
}

function prevWeekISO(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export async function fetchOverviewData(weekStart: string): Promise<OverviewData> {
  try {
    const { data: stores } = await getActiveStores()
    const lastWeekStart = prevWeekISO(weekStart)
    const month = weekStart.slice(0, 7)

    // 月初の7日前（前月末にまたがる週を取得するため）
    const monthFetchStart = new Date(weekStart.slice(0, 8) + '01')
    monthFetchStart.setDate(monthFetchStart.getDate() - 7)
    const monthFetchStartISO = monthFetchStart.toISOString().slice(0, 10)

    const overviews = await Promise.all(
      stores.map(async (store): Promise<StoreOverview> => {
        const [thisWeek, lastWeek, configResult, monthlyInputsResult] = await Promise.all([
          getWeeklyStoreInput(store.id, weekStart),
          getWeeklyStoreInput(store.id, lastWeekStart),
          getMonthlyConfig(store.id, month),
          getStoreInputsByDateRange(store.id, monthFetchStartISO, weekStart),
        ])

        // 按分方式で月累計売上を計算
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
          store,
          thisWeek: thisWeek ?? null,
          lastWeek: lastWeek ?? null,
          config: configResult.data,
          monthlySales,
          completedWeeks,
        }
      })
    )

    return { stores: overviews, error: null }
  } catch (e) {
    return { stores: [], error: String(e) }
  }
}
