'use server'

import { getActiveStores } from '@/lib/repositories/stores'
import { getWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getMonthlyConfig } from '@/lib/repositories/monthly-configs'
import type { Store, WeeklyStoreInput, MonthlyConfig } from '@/lib/types/db'

export type StoreOverview = {
  store: Store
  thisWeek: WeeklyStoreInput | null
  lastWeek: WeeklyStoreInput | null
  config: MonthlyConfig | null
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

    const overviews = await Promise.all(
      stores.map(async (store): Promise<StoreOverview> => {
        const [thisWeek, lastWeek, configResult] = await Promise.all([
          getWeeklyStoreInput(store.id, weekStart),
          getWeeklyStoreInput(store.id, lastWeekStart),
          getMonthlyConfig(store.id, month),
        ])
        return {
          store,
          thisWeek: thisWeek ?? null,
          lastWeek: lastWeek ?? null,
          config: configResult.data,
        }
      })
    )

    return { stores: overviews, error: null }
  } catch (e) {
    return { stores: [], error: String(e) }
  }
}
