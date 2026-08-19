'use server'

import { createClient } from '@/lib/supabase/server'
import {
  DECISION_CAPTURE_FIELDS,
  normalizeDecisionCaptureDraft,
} from '@/lib/services/decision-capture'
import {
  createAirtableDecisionRecord,
  type AirtableDecisionCoreValues,
} from '@/lib/repositories/airtable-decisions'
import type { DecisionCoreFieldKey } from '@/lib/types/decision'

export type DecisionInputActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

const DECISION_INPUT_FIELDS = DECISION_CAPTURE_FIELDS.filter(
  (field) => field.isCoreDecisionField,
)

const INITIAL_STATUS = '記録済み'

function readFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return null
  return trimmed
}

function buildTokyoDecisionTitle(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} Decision記録`
}

function buildCoreValues(formData: FormData): AirtableDecisionCoreValues {
  const rawInput = Object.fromEntries(
    DECISION_INPUT_FIELDS.map((field) => [field.key, readFormString(formData, field.key)]),
  )
  const draft = normalizeDecisionCaptureDraft(rawInput)

  return DECISION_INPUT_FIELDS.reduce((values, field) => {
    values[field.key as DecisionCoreFieldKey] = draft[field.key]
    return values
  }, {} as AirtableDecisionCoreValues)
}

export async function saveDecisionInput(
  _previousState: DecisionInputActionState,
  formData: FormData,
): Promise<DecisionInputActionState> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { status: 'error', message: 'ログインが必要です' }
  }

  const result = await createAirtableDecisionRecord({
    title: buildTokyoDecisionTitle(new Date()),
    status: process.env.AIRTABLE_DECISION_STATUS_VALUE?.trim() || INITIAL_STATUS,
    values: buildCoreValues(formData),
  })

  if (!result.ok) {
    const message = result.error === 'missing_config'
      ? '保存設定が未完了です'
      : '保存できませんでした'
    return { status: 'error', message }
  }

  return { status: 'success', message: '保存しました' }
}
