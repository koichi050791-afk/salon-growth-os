import {
  getAirtableDecisionRecord,
  listAirtableDecisionRecords,
  updateAirtableDecisionValidation,
  type AirtableDecisionRecord,
  type GetAirtableDecisionResult,
  type ListAirtableDecisionsResult,
  type UpdateAirtableDecisionValidationInput,
  type UpdateAirtableDecisionValidationResult,
} from '@/lib/repositories/airtable-decisions'
import {
  isCompletedDecisionValidationState,
  type CompletedDecisionValidationState,
} from '@/lib/types/decision-validation'

const AIRTABLE_RECORD_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/
const MAX_TEXT_CHARS = 2_000

export type DecisionValidationInput = {
  decisionId: unknown
  outcomeObserved: unknown
  validationState: unknown
  validationNote?: unknown
}

export type NormalizedDecisionValidationInput = {
  decisionId: string
  outcomeObserved: string
  validationState: CompletedDecisionValidationState
  validationNote: string | null
}

export type SaveDecisionValidationResult =
  | { ok: true; saved: true; decisionId: string; validationState: CompletedDecisionValidationState }
  | { ok: false; saved: false; error: 'invalid_input' | 'missing_config' | 'not_found' | 'not_real' | 'not_open' | 'already_validated' | 'persistence_failed' }

export type OpenDecisionValidationItem = {
  decisionId: string
  title: string
  consultationConcern: string | null
  chosenDecision: string | null
  notChosen: string | null
  nextObservation: string
}

export type ListOpenDecisionValidationsResult = {
  data: OpenDecisionValidationItem[]
  error: 'missing_config' | 'request_failed' | null
}

type SaveDecisionValidationDependencies = {
  getDecision?: (decisionId: string) => Promise<GetAirtableDecisionResult>
  updateValidation?: (input: UpdateAirtableDecisionValidationInput) => Promise<UpdateAirtableDecisionValidationResult>
}

type ListOpenDecisionValidationsDependencies = {
  listDecisions?: (limit?: number) => Promise<ListAirtableDecisionsResult>
}

function normalizeRequiredText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed && trimmed.length <= MAX_TEXT_CHARS ? trimmed : null
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (typeof value === 'undefined' || value === null || value === '') return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length <= MAX_TEXT_CHARS ? trimmed : undefined
}

export function normalizeDecisionValidationInput(input: DecisionValidationInput): NormalizedDecisionValidationInput | null {
  if (typeof input.decisionId !== 'string' || !AIRTABLE_RECORD_ID_PATTERN.test(input.decisionId)) return null
  const outcomeObserved = normalizeRequiredText(input.outcomeObserved)
  const validationNote = normalizeOptionalText(input.validationNote)
  if (!outcomeObserved || typeof validationNote === 'undefined' || !isCompletedDecisionValidationState(input.validationState)) return null

  return {
    decisionId: input.decisionId,
    outcomeObserved,
    validationState: input.validationState.trim().toUpperCase() as CompletedDecisionValidationState,
    validationNote,
  }
}

function mapReadError(error: GetAirtableDecisionResult['error']): Extract<SaveDecisionValidationResult, { ok: false }>['error'] {
  if (error === 'missing_config') return 'missing_config'
  if (error === 'not_found') return 'not_found'
  if (error === 'invalid_record_id') return 'invalid_input'
  return 'persistence_failed'
}

export async function saveDecisionValidation(
  input: DecisionValidationInput,
  dependencies: SaveDecisionValidationDependencies = {},
): Promise<SaveDecisionValidationResult> {
  const normalized = normalizeDecisionValidationInput(input)
  if (!normalized) return { ok: false, saved: false, error: 'invalid_input' }

  const read = dependencies.getDecision ?? getAirtableDecisionRecord
  const existing = await read(normalized.decisionId)
  if (existing.error || !existing.data) {
    return { ok: false, saved: false, error: mapReadError(existing.error ?? 'request_failed') }
  }

  if (existing.data.dataKind !== 'REAL') return { ok: false, saved: false, error: 'not_real' }
  if (!existing.data.values.nextObservation?.trim()) return { ok: false, saved: false, error: 'not_open' }
  if (existing.data.validation.validationState !== 'UNVALIDATED') return { ok: false, saved: false, error: 'already_validated' }

  const update = dependencies.updateValidation ?? updateAirtableDecisionValidation
  const updated = await update(normalized)
  if (!updated.ok) {
    return { ok: false, saved: false, error: updated.error === 'missing_config' ? 'missing_config' : 'persistence_failed' }
  }

  return {
    ok: true,
    saved: true,
    decisionId: normalized.decisionId,
    validationState: normalized.validationState,
  }
}

function projectOpenValidation(decision: AirtableDecisionRecord): OpenDecisionValidationItem | null {
  const nextObservation = decision.values.nextObservation?.trim()
  if (decision.dataKind !== 'REAL' || decision.validation.validationState !== 'UNVALIDATED' || !nextObservation) return null

  return {
    decisionId: decision.id,
    title: decision.title,
    consultationConcern: decision.values.consultationConcern,
    chosenDecision: decision.values.chosenDecision,
    notChosen: decision.values.notChosen,
    nextObservation,
  }
}

export async function listOpenDecisionValidations(
  limit = 50,
  dependencies: ListOpenDecisionValidationsDependencies = {},
): Promise<ListOpenDecisionValidationsResult> {
  const list = dependencies.listDecisions ?? listAirtableDecisionRecords
  const result = await list(limit)
  if (result.error) return { data: [], error: result.error }

  return {
    data: result.data.map(projectOpenValidation).filter((item): item is OpenDecisionValidationItem => item !== null),
    error: null,
  }
}
