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
    <main className="min-h-dvh bg-[#0B1220] text-[#E6ECF5]">
      <form
        key={formKey}
        action={formAction}
        className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-5"
      >
        <header className="flex items-start justify-between gap-4 pb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#D4AF37]">DECISION CAPTURE</p>
            <h1 className="mt-1 text-2xl font-bold">Decision記録</h1>
            <p className="mt-1 text-sm text-[#8B94A7]">3分以内。事実と判断を分けて残す。</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-[#111A2B] px-3 py-2 text-xs text-[#AEB7C8]"
          >
            ホーム
          </Link>
        </header>

        <div className="flex-1 space-y-3 pb-5">
          {fields.map((field) => (
            <label
              key={field.key}
              className="block rounded-2xl border border-white/10 bg-[#111A2B] p-3"
            >
              <span className="block pb-2 text-[15px] font-bold">
                {fieldLabels[field.key]}
              </span>
              <textarea
                name={field.key}
                value={draft[field.key] ?? ''}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                onInput={(event) => resizeTextarea(event.currentTarget)}
                placeholder={fieldPlaceholders[field.key]}
                rows={2}
                className="block min-h-[72px] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] px-3 py-3 text-base leading-relaxed text-[#E6ECF5] outline-none placeholder:text-[#536078] focus:border-[#D4AF37]/60"
              />
            </label>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-4 border-t border-white/10 bg-[#0B1220]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur">
          {state.message && (
            <p
              aria-live="polite"
              className={`mb-3 rounded-xl border px-3 py-2 text-sm ${
                state.status === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
              }`}
            >
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="min-h-[56px] w-full rounded-2xl bg-[#D4AF37] px-5 py-4 text-lg font-bold text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </main>
  )
}
