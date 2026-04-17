'use server'

import { revalidatePath } from 'next/cache'
import { upsertMonthlyConfig } from '@/lib/repositories/monthly-configs'

export type SaveState = {
  message: string
  success: boolean
}

function toNumber(val: FormDataEntryValue | null): number | null {
  if (val === null || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

export async function saveMonthlyConfig(
  prevState: SaveState,
  formData: FormData
): Promise<SaveState> {
  const storeId = formData.get('store_id') as string
  const targetMonth = formData.get('target_month') as string

  if (!storeId || !targetMonth) {
    return { message: '店舗と対象月は必須です', success: false }
  }

  const { error } = await upsertMonthlyConfig({
    store_id: storeId,
    target_month: targetMonth,
    target_sales: toNumber(formData.get('target_sales')),
    target_unit_price: toNumber(formData.get('target_unit_price')),
    target_visits: toNumber(formData.get('target_visits')),
    target_productivity: toNumber(formData.get('target_productivity')),
    target_repeat_rate: toNumber(formData.get('target_repeat_rate')),
    memo: (formData.get('memo') as string) || null,
  })

  if (error) {
    return { message: `保存に失敗しました: ${error}`, success: false }
  }

  revalidatePath('/monthly-config')
  return { message: '保存しました', success: true }
}
