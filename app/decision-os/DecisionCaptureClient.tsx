'use client'

import { useMemo, useState } from 'react'
import {
  buildDecisionCaptureClipboardText,
  EMPTY_DECISION_CAPTURE_DRAFT,
  getDecisionCaptureCompleteness,
  getDecisionFieldProjections,
} from '@/lib/services/decision-capture'
import type { DecisionCaptureDraft, DecisionCaptureKey } from '@/lib/types/decision'

const fieldTone: Record<DecisionCaptureKey, string> = {
  consultationConcern: 'border-white/10',
  customerTruth: 'border-sky-400/40',
  professionalHypothesis: 'border-amber-400/40',
  chosenDecision: 'border-[#D4AF37]/50',
  notChosen: 'border-fuchsia-400/30',
  nextObservation: 'border-emerald-400/40',
}

export default function DecisionCaptureClient() {
  const [draft, setDraft] = useState<DecisionCaptureDraft>(EMPTY_DECISION_CAPTURE_DRAFT)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const projections = useMemo(() => getDecisionFieldProjections(draft), [draft])
  const completeness = useMemo(() => getDecisionCaptureCompleteness(draft), [draft])
  const coreReady = completeness.knownCoreCount > 0

  function updateDraft(key: DecisionCaptureKey, value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
    setCopyState('idle')
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(buildDecisionCaptureClipboardText(draft))
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  function resetDraft() {
    setDraft(EMPTY_DECISION_CAPTURE_DRAFT)
    setCopyState('idle')
  }

  return (
    <section className="space-y-4">
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-[#D4AF37]/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[#D4AF37] text-xs font-bold">Airtable capture helper</p>
            <h2 className="text-[#E6ECF5] text-xl font-bold mt-1">Decision 5項目</h2>
          </div>
          <span className="shrink-0 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">
            {completeness.knownCoreCount}/{completeness.totalCoreCount}
          </span>
        </div>
        <p className="text-[#8B94A7] text-sm mt-3">
          ここでは保存しません。Customer Truth と Professional Hypothesis を分けたまま、Airtable の Decision に移すための一時メモです。
        </p>
        {!coreReady && (
          <p className="text-[#8B94A7] text-xs mt-3 rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2">
            まだ core field は unknown です。分からない項目は空欄/null のままで扱います。
          </p>
        )}
      </div>

      <div className="space-y-3">
        {projections.map((projection) => {
          const { definition, state } = projection
          return (
            <label
              key={definition.key}
              className={`block bg-[#111A2B] rounded-2xl p-4 border ${fieldTone[definition.key]}`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#E6ECF5] text-sm font-bold">{definition.label}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-bold text-[#8B94A7]">
                      {definition.airtableField}
                    </span>
                  </div>
                  <p className="text-[#8B94A7] text-xs mt-1">{definition.boundaryNote}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  state === 'known'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/5 text-[#8B94A7]'
                }`}>
                  {state === 'known' ? 'known' : 'unknown'}
                </span>
              </div>
              <textarea
                value={draft[definition.key] ?? ''}
                onChange={(event) => updateDraft(definition.key, event.target.value)}
                placeholder={definition.placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#0B1220] p-3 text-sm text-[#E6ECF5] placeholder:text-[#536078] focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </label>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={copyDraft}
          className="rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90"
        >
          コピー
        </button>
        <button
          type="button"
          onClick={resetDraft}
          className="rounded-xl border border-white/10 bg-[#111A2B] px-4 py-3 text-sm font-bold text-[#E6ECF5] transition hover:border-white/20"
        >
          リセット
        </button>
      </div>

      {copyState === 'copied' && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          Airtable 転記用のテキストをコピーしました。
        </p>
      )}
      {copyState === 'error' && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          クリップボードにコピーできませんでした。ブラウザ権限を確認してください。
        </p>
      )}
    </section>
  )
}
