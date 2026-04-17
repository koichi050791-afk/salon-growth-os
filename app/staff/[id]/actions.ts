'use server'

import { revalidatePath } from 'next/cache'
import { upsertActionLog } from '@/lib/repositories/action-logs'

export async function recordActionLog(
  staffId: string,
  weekDate: string,
  actionText: string,
  isExecuted: boolean
): Promise<{ error: string | null }> {
  const { error } = await upsertActionLog({
    staff_id: staffId,
    week_date: weekDate,
    action_text: actionText,
    is_executed: isExecuted,
  })

  if (error) return { error }

  revalidatePath(`/staff/${staffId}`)
  return { error: null }
}
