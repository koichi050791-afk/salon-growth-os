import type {
  DecisionCaptureBoundary,
  DecisionCaptureCompleteness,
  DecisionCaptureDraft,
  DecisionCaptureFieldKey,
  DecisionCaptureKey,
  DecisionFieldDefinition,
  DecisionFieldProjection,
} from '@/lib/types/decision'

export const DECISION_CAPTURE_BOUNDARY: DecisionCaptureBoundary = {
  canonicalSource: 'airtable',
  canonicalSourceLabel: 'Airtable Decision table',
  appStorage: 'none',
  appRole: 'local_capture_projection',
  piiPolicy: 'no_customer_pii',
  duplicateInputPolicy: 'copy_to_canonical_only',
}

export const DECISION_CAPTURE_FIELDS: DecisionFieldDefinition[] = [
  {
    key: 'consultationConcern',
    label: 'Consultation / concern',
    shortLabel: '相談',
    airtableField: '今回の相談',
    role: 'context',
    canonicalSource: 'airtable',
    isCoreDecisionField: false,
    placeholder: '例: 広がりが気になる。朝のセット時間を短くしたい。',
    boundaryNote: '相談内容は文脈です。未確認の背景は足さない。',
    issue13Linkage: null,
    issue14RetrievalRole: 'future retrieval can use this as a concern/theme cue',
  },
  {
    key: 'customerTruth',
    label: 'Customer Truth',
    shortLabel: '事実',
    airtableField: '確認した事実',
    role: 'customer_truth',
    canonicalSource: 'airtable',
    isCoreDecisionField: true,
    placeholder: '顧客が話したこと、観察できた状態、確認済み履歴だけを書く。',
    boundaryNote: '美容師側の解釈や原因推定を混ぜない。',
    issue13Linkage: 'Outcome should later be recorded as a new observation, not proof.',
    issue14RetrievalRole: 'past truth is context only; current state must be reconfirmed',
  },
  {
    key: 'professionalHypothesis',
    label: 'Professional Hypothesis',
    shortLabel: '仮説',
    airtableField: 'Professional Hypothesis',
    role: 'professional_hypothesis',
    canonicalSource: 'airtable',
    isCoreDecisionField: true,
    placeholder: '原因推定、解釈、予測を書く。未確認なら空欄でよい。',
    boundaryNote: '仮説は事実ではない。Customer Truth に昇格させない。',
    issue13Linkage: 'Validation may support, weaken, or revise this hypothesis.',
    issue14RetrievalRole: 'show as prior hypothesis, never as current customer truth',
  },
  {
    key: 'chosenDecision',
    label: 'Chosen Decision',
    shortLabel: '選んだ判断',
    airtableField: '選んだ方法',
    role: 'chosen_decision',
    canonicalSource: 'airtable',
    isCoreDecisionField: true,
    placeholder: '今回選んだ施術・提案・判断を書く。',
    boundaryNote: '複数案がある中で選んだ内容だけを書く。',
    issue13Linkage: 'Outcome can later attach to this selected decision.',
    issue14RetrievalRole: 'retrieval should show this as the last relevant decision',
  },
  {
    key: 'notChosen',
    label: 'Not Chosen',
    shortLabel: 'あえてしない',
    airtableField: 'あえてしなかったこと',
    role: 'not_chosen',
    canonicalSource: 'airtable',
    isCoreDecisionField: true,
    placeholder: '今回あえて選ばなかった施術・提案・行動を書く。',
    boundaryNote: '「しなかった理由」が不明なら、理由を補完しない。',
    issue13Linkage: 'Outcome may later explain whether this avoidance still holds.',
    issue14RetrievalRole: 'retrieval should keep this visible to avoid repeating old tradeoffs',
  },
  {
    key: 'nextObservation',
    label: 'Next Observation',
    shortLabel: '次回確認',
    airtableField: '次回確認',
    role: 'next_observation',
    canonicalSource: 'airtable',
    isCoreDecisionField: true,
    placeholder: '次に何を確認するかを書く。予約促進ではなく観察点。',
    boundaryNote: '未確認なら unknown のまま。次回来店の理由と観察点を分ける。',
    issue13Linkage: 'This is the natural entry point for Outcome / Validation.',
    issue14RetrievalRole: 'retrieval should surface open next observations first',
  },
]

export const EMPTY_DECISION_CAPTURE_DRAFT: DecisionCaptureDraft =
  DECISION_CAPTURE_FIELDS.reduce((draft, field) => {
    draft[field.key] = null
    return draft
  }, {} as DecisionCaptureDraft)

function normalizeValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeDecisionCaptureDraft(
  input: Partial<Record<DecisionCaptureKey, string | null | undefined>>,
): DecisionCaptureDraft {
  return DECISION_CAPTURE_FIELDS.reduce((draft, field) => {
    draft[field.key] = normalizeValue(input[field.key])
    return draft
  }, {} as DecisionCaptureDraft)
}

export function getDecisionFieldProjections(
  input: Partial<Record<DecisionCaptureKey, string | null | undefined>>,
): DecisionFieldProjection[] {
  const draft = normalizeDecisionCaptureDraft(input)
  return DECISION_CAPTURE_FIELDS.map((definition) => {
    const value = draft[definition.key]
    return {
      definition,
      value,
      state: value === null ? 'unknown' : 'known',
    }
  })
}

export function getDecisionCaptureCompleteness(
  input: Partial<Record<DecisionCaptureKey, string | null | undefined>>,
): DecisionCaptureCompleteness {
  const projections = getDecisionFieldProjections(input)
  const core = projections.filter((projection) => projection.definition.isCoreDecisionField)
  const unknownCoreKeys = core
    .filter((projection) => projection.state === 'unknown')
    .map((projection) => projection.definition.key as DecisionCaptureFieldKey)

  return {
    knownCoreCount: core.length - unknownCoreKeys.length,
    totalCoreCount: core.length,
    unknownCoreKeys,
  }
}

export function buildDecisionCaptureClipboardText(
  input: Partial<Record<DecisionCaptureKey, string | null | undefined>>,
): string {
  const projections = getDecisionFieldProjections(input)

  return [
    'Decision OS v0.1',
    `Canonical source: ${DECISION_CAPTURE_BOUNDARY.canonicalSourceLabel}`,
    'Salon Growth OS storage: none',
    '',
    ...projections.flatMap((projection) => [
      `${projection.definition.label} / ${projection.definition.airtableField}`,
      projection.value ?? 'unknown',
      '',
    ]),
    'Boundary',
    '- Customer Truth and Professional Hypothesis are separate.',
    '- Missing information remains unknown/null.',
    '- Do not add customer PII to Salon Growth OS, GitHub, fixtures, logs, or screenshots.',
  ].join('\n')
}
