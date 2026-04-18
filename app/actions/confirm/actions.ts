'use server'

import { revalidatePath } from 'next/cache'
import { getWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getLatestImprovementAction, upsertImprovementAction } from '@/lib/repositories/improvement-actions'
import { diagnoseIssue } from '@/lib/services/improvement-engine'
import type { ImprovementAction } from '@/lib/types/db'
import type { DiagnoseResult } from '@/lib/services/improvement-engine'

function getSundayISO(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return sunday.toISOString().slice(0, 10)
}

function prevWeekISO(iso: string): string {
  const d = new Date(iso)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export type ConfirmPageData = {
  diagnose: DiagnoseResult | null
  weekStart: string
  existing: ImprovementAction | null
  error: string | null
}

export async function fetchConfirmData(storeId: string): Promise<ConfirmPageData> {
  try {
    const weekStart = getSundayISO()
    const lastWeekStart = prevWeekISO(weekStart)

    const [thisWeek, lastWeek, configResult, existing, prevAction] = await Promise.all([
      getWeeklyStoreInput(storeId, weekStart),
      getWeeklyStoreInput(storeId, lastWeekStart),
      getLatestMonthlyConfig(storeId),
      getLatestImprovementAction(storeId),
      getLatestImprovementAction(storeId),
    ])

    const config = configResult.data
    const prevIssueType = prevAction?.issue_type as Parameters<typeof diagnoseIssue>[3] | undefined
    const result = diagnoseIssue(thisWeek ?? null, lastWeek ?? null, config, prevIssueType)

    return { diagnose: result, weekStart, existing, error: null }
  } catch (e) {
    return { diagnose: null, weekStart: getSundayISO(), existing: null, error: String(e) }
  }
}

export async function saveConfirmedAction(
  storeId: string,
  weekStart: string,
  issueType: string,
  issueCause: string,
  actionTitle: string,
  actionDetail: string,
): Promise<{ error: string | null }> {
  try {
    await upsertImprovementAction({
      store_id: storeId,
      week_start: weekStart,
      issue_type: issueType,
      issue_cause: issueCause,
      action_title: actionTitle,
      action_detail: actionDetail,
      status: 'planned',
    })
    revalidatePath('/actions')
    revalidatePath('/')
    return { error: null }
  } catch (e) {
    return { error: String(e) }
  }
}
