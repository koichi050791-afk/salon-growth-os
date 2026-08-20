'use client'

import { useActionState } from 'react'
import type { DecisionValidationResult } from '@/lib/types/decision'
import { saveDecisionOutcome, type OutcomeValidationActionState } from './actions'

const initialState: OutcomeValidationActionState = {
  status: 'idle',
  message: null,
}

const validationOptions: Array<{
  value: DecisionValidationResult
  label: string
}> = [
  { value: 'supported', label: 'Supported' },
  { value: 'partially_supported', label: 'Partial' },
  { value: 'contradicted', label: 'Contradicted' },
  { value: 'insufficient_evidence', label: 'Insufficient' },
]

export default function OutcomeValidationForm({ decisionId }: { decisionId: string }) {
  const [state, formAction, pending] = useActionState(
    saveDecisionOutcome.bind(null, decisionId),
    initialState,
  )

  return (
    <form action={formAction} className="space-y-5">
      <label className="block border-b border-[var(--line)] pb-5">
        <span className="text-base font-medium">Outcome</span>
        <textarea
          name="observation"
          rows={3}
          className="mt-3 block min-h-[108px] w-full resize-y border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-base leading-7 text-[var(--ink)] outline-none placeholder:text-[color:rgba(119,115,107,0.62)] focus:border-[var(--gold)] focus:bg-white"
          placeholder="今回わかったこと"
        />
      </label>

      <fieldset className="border-b border-[var(--line)] pb-5">
        <legend className="text-base font-medium">Validation</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {validationOptions.map((option) => (
            <label
              key={option.value}
              className="flex min-h-[52px] items-center gap-2 border border-[var(--line)] bg-[var(--paper-soft)] px-3 text-sm"
            >
              <input
                type="radio"
                name="validationResult"
                value={option.value}
                className="size-4 accent-[var(--charcoal)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
        className="min-h-[58px] w-full bg-[var(--charcoal)] px-5 py-4 text-lg font-medium text-[var(--paper-soft)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
