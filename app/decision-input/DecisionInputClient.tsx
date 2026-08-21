'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useState } from 'react'
import {
  DECISION_CAPTURE_FIELDS,
  EMPTY_DECISION_CAPTURE_DRAFT,
} from '@/lib/services/decision-capture'
import { runAfterCurrentEffect } from '@/lib/utils/deferred-effect'
import type { DecisionCaptureDraft, DecisionCaptureKey } from '@/lib/types/decision'
import { saveDecisionInput, type DecisionInputActionState } from './actions'

const initialState: DecisionInputActionState = {
  status: 'idle',
  message: null,
}

const fieldLabels: Record<DecisionCaptureKey, string> = {
  consultationConcern: '相談',
  customerTruth: '確認した事実',
  professionalHypothesis: '仮説',
  chosenDecision: '今回の判断',
  notChosen: 'あえてしなかったこと',
  nextObservation: '次回確認',
}

const fieldPlaceholders: Record<DecisionCaptureKey, string> = {
  consultationConcern: '例: 広がり、朝の扱いやすさ',
  customerTruth: '聞いたこと・見た状態だけ',
  professionalHypothesis: '',
  chosenDecision: '今回選んだ施術や提案',
  notChosen: '今回はしなかったこと',
  nextObservation: '次に見ること',
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

export default function DecisionInputClient() {
  const [draft, setDraft] = useState<DecisionCaptureDraft>(EMPTY_DECISION_CAPTURE_DRAFT)
  const [formKey, setFormKey] = useState(0)
  const [state, formAction, pending] = useActionState(saveDecisionInput, initialState)
  const fields = useMemo(
    () => DECISION_CAPTURE_FIELDS.filter((field) => field.isCoreDecisionField),
    [],
  )

  useEffect(() => {
    if (state.status !== 'success') return

    return runAfterCurrentEffect(() => {
      setDraft(EMPTY_DECISION_CAPTURE_DRAFT)
      setFormKey((key) => key + 1)
    })
  }, [state])

  function updateDraft(key: DecisionCaptureKey, value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <main className="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <form
        key={formKey}
        action={formAction}
        className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pt-5"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Manual Fallback
            </p>
            <h1 className="mt-2 text-[32px] font-medium leading-tight">予備入力</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">専用GPTを使えない場合のみ</p>
          </div>
          <Link
            href="/"
            className="min-h-[44px] shrink-0 border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-xs text-[var(--muted)]"
          >
            ホーム
          </Link>
        </header>

        <div className="flex-1 pb-5">
          {fields.map((field, index) => (
            <label
              key={field.key}
              className="block border-b border-[var(--line)] py-5"
            >
              <span className="mb-2 flex items-center gap-3">
                <span className="text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-base font-medium">{fieldLabels[field.key]}</span>
              </span>
              <textarea
                name={field.key}
                value={draft[field.key] ?? ''}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                onInput={(event) => resizeTextarea(event.currentTarget)}
                placeholder={fieldPlaceholders[field.key]}
                rows={2}
                className="block min-h-[86px] w-full resize-none overflow-hidden border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-base leading-7 text-[var(--ink)] outline-none placeholder:text-[color:rgba(119,115,107,0.62)] focus:border-[var(--gold)] focus:bg-white"
              />
            </label>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-5 border-t border-[var(--line)] bg-[var(--paper)]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur">
          {state.message && (
            <p
              aria-live="polite"
              className={`mb-3 border px-3 py-2 text-sm ${
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
            className="min-h-[58px] w-full bg-[var(--charcoal)] px-5 py-4 text-lg font-medium text-[var(--paper-soft)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? '保存中…' : '予備入力を保存'}
          </button>
        </div>
      </form>
    </main>
  )
}
