'use server'

import { revalidatePath } from 'next/cache'
import { getLatestImprovementAction, getRecentImprovementActions, updateImprovementAction } from '@/lib/repositories/improvement-actions'
import type { ImprovementAction } from '@/lib/types/db'

export type ActionsPageData = {
  latest: ImprovementAction | null
  history: ImprovementAction[]
  error: string | null
}

export async function fetchActionsData(storeId: string): Promise<ActionsPageData> {
  try {
    const [latest, historyResult] = await Promise.all([
      getLatestImprovementAction(storeId),
      getRecentImprovementActions(storeId, 5),
    ])
    return { latest, history: historyResult.data, error: null }
  } catch (e) {
    return { latest: null, history: [], error: String(e) }
  }
}

export async function completeAction(
  id: string,
  resultStatus: 'improved' | 'unchanged' | 'worsened',
  resultNote: string,
  nextDecision: 'continue' | 'switch',
): Promise<{ error: string | null }> {
  try {
    await updateImprovementAction(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_status: resultStatus,
      result_note: resultNote || null,
      next_decision: nextDecision,
    })
    revalidatePath('/actions')
    revalidatePath('/')
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function skipAction(id: string): Promise<{ error: string | null }> {
  try {
    await updateImprovementAction(id, { status: 'skipped' })
    revalidatePath('/actions')
    revalidatePath('/')
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}
