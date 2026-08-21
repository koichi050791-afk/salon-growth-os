'use server'

import { createClient } from '@/lib/supabase/server'
import { DECISION_CAPTURE_FIELDS } from '@/lib/services/decision-capture'
import {
  saveDecisionCapture,
  type DecisionCaptureSaveFields,
} from '@/lib/services/decision-capture-save'

export type DecisionInputActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

function readFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') return null
  return value
}

function buildFormFields(formData: FormData): DecisionCaptureSaveFields {
  return Object.fromEntries(
    DECISION_CAPTURE_FIELDS.map((field) => [field.key, readFormValue(formData, field.key)]),
  ) as DecisionCaptureSaveFields
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

  const result = await saveDecisionCapture({
    source: 'DECISION_INPUT',
    fields: buildFormFields(formData),
  })

  if (!result.ok) {
    const message = result.error === 'missing_config'
      ? '保存設定が未完了です'
      : '保存できませんでした'
    return { status: 'error', message }
  }

  return { status: 'success', message: '保存しました' }
}
