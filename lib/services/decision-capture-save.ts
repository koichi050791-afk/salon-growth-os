import {
  createAirtableDecisionRecord,
  type AirtableDecisionCoreValues,
  type CreateAirtableDecisionInput,
  type CreateAirtableDecisionResult,
} from '@/lib/repositories/airtable-decisions'
import {
  DECISION_CAPTURE_FIELDS,
  normalizeDecisionCaptureDraft,
} from '@/lib/services/decision-capture'
import {
  safeDispatchDecisionCaptured,
  safeDispatchNextObservationCreated,
} from '@/lib/services/work-graph'
import type {
  DecisionCaptureSource,
  DecisionDataKind,
  DecisionCoreFieldKey,
  DecisionUnsupportedOptionalFieldKey,
} from '@/lib/types/decision'
import type { EvidenceRef, WorkGraphDispatchResult } from '@/lib/types/ai-operations'

export type DecisionCaptureSaveFields = Partial<Record<
  DecisionCoreFieldKey | DecisionUnsupportedOptionalFieldKey,
  string | null | undefined
>>

export type DecisionCaptureSaveWarningCode =
  | 'UNSUPPORTED_FIELD_NOT_PERSISTED'
  | 'DOWNSTREAM_DISPATCH_FAILED'

export type DecisionCaptureSaveWarning = {
  code: DecisionCaptureSaveWarningCode
  field?: DecisionUnsupportedOptionalFieldKey
  message: string
}

export type DecisionCaptureDownstreamStatus = {
  decisionCaptured: 'dispatched' | 'failed'
  nextObservation: 'dispatched' | 'failed' | 'skipped'
}

export type SaveDecisionCaptureInput = {
  fields: DecisionCaptureSaveFields
  source?: DecisionCaptureSource
  dataKind?: DecisionDataKind
  sourceRefs?: readonly EvidenceRef[]
  now?: Date
}

export type SaveDecisionCaptureSuccess = {
  ok: true
  saved: true
  decisionId: string
  title: string
  savedAt: string
  captureSource: DecisionCaptureSource
  dataKind: DecisionDataKind
  downstream: DecisionCaptureDownstreamStatus
  warnings: readonly DecisionCaptureSaveWarning[]
  unsupportedFields: readonly DecisionUnsupportedOptionalFieldKey[]
}

export type SaveDecisionCaptureFailure = {
  ok: false
  saved: false
  error: 'missing_config' | 'persistence_failed'
  warnings: readonly DecisionCaptureSaveWarning[]
  unsupportedFields: readonly DecisionUnsupportedOptionalFieldKey[]
}

export type SaveDecisionCaptureResult = SaveDecisionCaptureSuccess | SaveDecisionCaptureFailure

type SaveDecisionCaptureDependencies = {
  createDecisionRecord?: (
    input: CreateAirtableDecisionInput,
  ) => Promise<CreateAirtableDecisionResult>
  dispatchDecisionCaptured?: typeof safeDispatchDecisionCaptured
  dispatchNextObservationCreated?: typeof safeDispatchNextObservationCreated
}

const DECISION_INPUT_FIELDS = DECISION_CAPTURE_FIELDS.filter(
  (field) => field.isCoreDecisionField,
)

const UNSUPPORTED_OPTIONAL_FIELDS: readonly DecisionUnsupportedOptionalFieldKey[] = [
  'professionalHypothesis',
  'treatmentAction',
  'notChosenReason',
]

const INITIAL_STATUS = '記録済み'

function normalizeStructuredValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'unknown') return null
  return trimmed
}

export function buildTokyoDecisionTitle(date: Date): string {
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

export function normalizeDecisionCaptureSaveValues(
  fields: DecisionCaptureSaveFields,
): AirtableDecisionCoreValues {
  const rawInput = Object.fromEntries(
    DECISION_INPUT_FIELDS.map((field) => [
      field.key,
      normalizeStructuredValue(fields[field.key as DecisionCoreFieldKey]),
    ]),
  )
  const draft = normalizeDecisionCaptureDraft(rawInput)

  return DECISION_INPUT_FIELDS.reduce((values, field) => {
    values[field.key as DecisionCoreFieldKey] = draft[field.key]
    return values
  }, {} as AirtableDecisionCoreValues)
}

function collectUnsupportedFields(
  fields: DecisionCaptureSaveFields,
): readonly DecisionUnsupportedOptionalFieldKey[] {
  return UNSUPPORTED_OPTIONAL_FIELDS.filter((field) =>
    normalizeStructuredValue(fields[field]) !== null,
  )
}

function buildUnsupportedWarnings(
  fields: readonly DecisionUnsupportedOptionalFieldKey[],
): readonly DecisionCaptureSaveWarning[] {
  return fields.map((field) => ({
    code: 'UNSUPPORTED_FIELD_NOT_PERSISTED',
    field,
    message: `${field} is not persisted by the Decision-centered Case v0.1 save boundary.`,
  }))
}

function buildStatus(): string {
  return process.env.AIRTABLE_DECISION_STATUS_VALUE?.trim() || INITIAL_STATUS
}

async function dispatchDecisionCaptured(
  input: Parameters<typeof safeDispatchDecisionCaptured>[0],
  dispatch: typeof safeDispatchDecisionCaptured,
): Promise<WorkGraphDispatchResult | null> {
  try {
    return await dispatch(input)
  } catch {
    return null
  }
}

async function dispatchNextObservationCreated(
  input: Parameters<typeof safeDispatchNextObservationCreated>[0],
  dispatch: typeof safeDispatchNextObservationCreated,
): Promise<WorkGraphDispatchResult | null> {
  try {
    return await dispatch(input)
  } catch {
    return null
  }
}

export async function saveDecisionCapture(
  input: SaveDecisionCaptureInput,
  dependencies: SaveDecisionCaptureDependencies = {},
): Promise<SaveDecisionCaptureResult> {
  const now = input.now ?? new Date()
  const captureSource = input.source ?? 'UNKNOWN'
  const dataKind = input.dataKind ?? 'UNKNOWN'
  const unsupportedFields = collectUnsupportedFields(input.fields)
  const warnings: DecisionCaptureSaveWarning[] = [
    ...buildUnsupportedWarnings(unsupportedFields),
  ]
  const title = buildTokyoDecisionTitle(now)
  const values = normalizeDecisionCaptureSaveValues(input.fields)
  const createDecisionRecord = dependencies.createDecisionRecord ?? createAirtableDecisionRecord
  const result = await createDecisionRecord({
    title,
    status: buildStatus(),
    dataKind,
    values,
  })

  if (!result.ok || !result.recordId) {
    return {
      ok: false,
      saved: false,
      error: result.error === 'missing_config' ? 'missing_config' : 'persistence_failed',
      warnings,
      unsupportedFields,
    }
  }

  const dispatchDecision = dependencies.dispatchDecisionCaptured ?? safeDispatchDecisionCaptured
  const dispatchNextObservation = dependencies.dispatchNextObservationCreated
    ?? safeDispatchNextObservationCreated
  const decisionDispatch = await dispatchDecisionCaptured({
    decisionRecordId: result.recordId,
    title,
    values,
    occurredAt: now,
    captureSource,
    dataKind,
    additionalSourceRefs: input.sourceRefs ?? [],
  }, dispatchDecision)
  const nextObservationDispatch = values.nextObservation
    ? await dispatchNextObservationCreated({
      decisionId: result.recordId,
      observedAt: now,
    }, dispatchNextObservation)
    : null
  const downstream: DecisionCaptureDownstreamStatus = {
    decisionCaptured: decisionDispatch?.ok ? 'dispatched' : 'failed',
    nextObservation: values.nextObservation
      ? nextObservationDispatch?.ok ? 'dispatched' : 'failed'
      : 'skipped',
  }

  if (downstream.decisionCaptured === 'failed' || downstream.nextObservation === 'failed') {
    warnings.push({
      code: 'DOWNSTREAM_DISPATCH_FAILED',
      message: 'The Airtable Decision was saved, but downstream dispatch did not fully complete.',
    })
  }

  return {
    ok: true,
    saved: true,
    decisionId: result.recordId,
    title,
    savedAt: now.toISOString(),
    captureSource,
    dataKind,
    downstream,
    warnings,
    unsupportedFields,
  }
}
