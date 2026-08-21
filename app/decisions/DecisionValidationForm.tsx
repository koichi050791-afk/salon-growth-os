'use client'

import { useActionState } from 'react'
import {
  saveDecisionValidationAction,
  type DecisionValidationActionState,
} from './actions'

const INITIAL_STATE: DecisionValidationActionState = {
  status: 'idle',
  message: null,
}

export function DecisionValidationForm({ decisionId }: { decisionId: string }) {
  const action = saveDecisionValidationAction.bind(null, decisionId)
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE)

  return (
    <details className="border-t border-[var(--line)] pt-4">
      <summary className="cursor-pointer py-2 text-sm font-medium text-[var(--gold)]">
        次回来店結果を記録
      </summary>
      <form action={formAction} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-xs text-[var(--muted)]">確認できた事実・本人の言葉</span>
          <textarea
            name="outcomeObserved"
            required
            maxLength={2000}
            rows={3}
            placeholder="例：本人から『朝まとまりやすかった』と確認。顔まわりの広がりは雨の日に残った。"
            className="mt-2 block min-h-[96px] w-full resize-y border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-base leading-7 outline-none focus:border-[var(--gold)] focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs text-[var(--muted)]">前回判断との比較</span>
          <select
            name="validationState"
            required
            defaultValue=""
            className="mt-2 min-h-[50px] w-full border border-[var(--line)] bg-[var(--paper-soft)] px-3 text-base outline-none focus:border-[var(--gold)] focus:bg-white"
          >
            <option value="" disabled>選択してください</option>
            <option value="CONFIRMED">概ね合っていた</option>
            <option value="PARTIAL">一部は合っていた</option>
            <option value="CONTRADICTED">合っていなかった</option>
            <option value="INCONCLUSIVE">今回は判断できない</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-[var(--muted)]">検証メモ（解釈・次に修正すること）</span>
          <textarea
            name="validationNote"
            maxLength={2000}
            rows={2}
            placeholder="任意。結果そのものではなく、美容師側の解釈を記録。"
            className="mt-2 block min-h-[80px] w-full resize-y border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-base leading-7 outline-none focus:border-[var(--gold)] focus:bg-white"
          />
        </label>

        {state.message && (
          <p
            aria-live="polite"
            className={`border px-3 py-2 text-sm ${
              state.status === 'success'
                ? 'border-[var(--green)]/25 bg-[var(--green)]/10 text-[var(--green)]'
                : 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
            }`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-[50px] w-full bg-[var(--charcoal)] px-4 py-3 text-sm font-medium text-[var(--paper-soft)] disabled:opacity-60"
        >
          {pending ? '保存中…' : '結果を保存'}
        </button>
      </form>
    </details>
  )
}
