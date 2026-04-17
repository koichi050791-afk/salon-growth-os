'use server'

import { revalidatePath } from 'next/cache'
import { upsertDailyRecord } from '@/lib/repositories/daily-records'

export type SaveWeeklyState = {
  message: string
  success: boolean
}

function toNumber(val: FormDataEntryValue | null): number | null {
  if (val === null || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function saveWeeklyRecord(
  prevState: SaveWeeklyState,
  formData: FormData
): Promise<SaveWeeklyState> {
  const storeId = formData.get('store_id') as string
  const weekDate = formData.get('week_date') as string

  if (!storeId || !weekDate) {
    return { message: '店舗と対象週は必須です', success: false }
  }

  const sales = toNumber(formData.get('sales'))
  const visits = toNumber(formData.get('visits'))
  const repeatRate = toNumber(formData.get('repeat_rate'))
  const reviewCount = toNumber(formData.get('review_count'))

  if (sales === null || visits === null) {
    return { message: '売上と客数は必須です', success: false }
  }

  const unitPrice = visits > 0 ? Math.round(sales / visits) : null
  const recordDate = getMondayOfWeek(weekDate)

  const { error } = await upsertDailyRecord({
    store_id: storeId,
    record_date: recordDate,
    sales,
    visits,
    unit_price: unitPrice,
    repeat_rate: repeatRate,
    review_count: reviewCount,
  })

  if (error) {
    return { message: `保存に失敗しました: ${error}`, success: false }
  }

  revalidatePath('/dashboard')
  revalidatePath('/weekly-input')
  return { message: `保存しました（週: ${recordDate}）`, success: true }
}
