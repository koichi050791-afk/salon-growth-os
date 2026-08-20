'use server'

import { revalidatePath } from 'next/cache'
import {
  getAirtableDecisionRecord,
  updateAirtableDecisionOutcomeValidation,
} from '@/lib/repositories/airtable-decisions'
import { safeDispatchOutcomeValidationCaptured } from '@/lib/services/work-graph'
import { createClient } from '@/lib/supabase/server'
import type { DecisionValidationResult } from '@/lib/types/decision'

export type OutcomeValidationActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

const VALIDATION_RESULTS: readonly DecisionValidationResult[] = [
  'supported',
  'partially_supported',
  'contradicted',
  'insufficient_evidence',
]

function readText(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readValidationResult(formData: FormData): DecisionValidationResult | null {
  const value = formData.get('validationResult')
  return typeof value === 'string' && VALIDATION_RESULTS.includes(value as DecisionValidationResult)
    ? value as DecisionValidationResult
    : null
}

export async function saveDecisionOutcome(
  decisionId: string,
  _previousState: OutcomeValidationActionState,
  formData: FormData,
): Promise<OutcomeValidationActionState> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { status: 'error', message: 'ログインが必要です' }
  }

  const observation = readText(formData, 'observation')
  const validationResult = readValidationResult(formData)
  if (!observation || !validationResult) {
    return { status: 'error', message: 'OutcomeとValidationを選んでください' }
  }

  const existingDecision = await getAirtableDecisionRecord(decisionId)
  if (!existingDecision.data) {
    return { status: 'error', message: 'Decisionを確認できませんでした' }
  }

  const observedAt = new Date().toISOString()
  const result = await updateAirtableDecisionOutcomeValidation({
    decisionId,
    observedAt,
    observation,
    customerReaction: readText(formData, 'customerReaction'),
    validationResult,
  })

  if (!result.ok || !result.outcomeId || !result.validationId) {
    const message = result.error === 'missing_config'
      ? '保存設定が未完了です'
      : '保存できませんでした'
    return { status: 'error', message }
  }

  await safeDispatchOutcomeValidationCaptured({
    decisionId,
    outcomeId: result.outcomeId,
    validationId: result.validationId,
    validationResult,
    observedAt,
    visitId: existingDecision.data.visitId,
  })

  revalidatePath('/decisions')
  revalidatePath(`/decisions/${decisionId}/outcome`)

  return { status: 'success', message: 'Outcome / Validationを保存しました' }
}
