'use server'

import { revalidatePath } from 'next/cache'
import { getServerUser } from '@/lib/auth/server-user'
import { saveDecisionValidation } from '@/lib/services/decision-validation'

export type DecisionValidationActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
}

function readFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

export async function saveDecisionValidationAction(
  decisionId: string,
  _previousState: DecisionValidationActionState,
  formData: FormData,
): Promise<DecisionValidationActionState> {
  const user = await getServerUser()
  if (!user) {
    return { status: 'error', message: 'ログインが必要です' }
  }

  const result = await saveDecisionValidation({
    decisionId,
    outcomeObserved: readFormValue(formData, 'outcomeObserved'),
    validationState: readFormValue(formData, 'validationState'),
    validationNote: readFormValue(formData, 'validationNote'),
  })

  if (!result.ok) {
    const messageByError: Record<typeof result.error, string> = {
      invalid_input: '確認できた結果と検証状態を入力してください',
      missing_config: '保存設定を確認できませんでした',
      not_found: '元の判断記録が見つかりませんでした',
      not_real: '実際の施術判断だけを検証できます',
      not_open: '次回確認が記録された判断だけを検証できます',
      already_validated: 'この判断は検証済みです',
      persistence_failed: '結果を保存できませんでした',
    }
    return { status: 'error', message: messageByError[result.error] }
  }

  revalidatePath('/decisions')
  revalidatePath('/')
  return { status: 'success', message: '次回来店結果を保存しました' }
}
