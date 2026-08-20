import type {
  DecisionCoreFieldKey,
  DecisionLoopOutcome,
  DecisionLoopValidation,
  DecisionValidationResult,
} from '@/lib/types/decision'

export type AirtableDecisionCoreValues = Record<DecisionCoreFieldKey, string | null>

export type CreateAirtableDecisionInput = {
  title: string
  status: string
  values: AirtableDecisionCoreValues
}

export type CreateAirtableDecisionResult = {
  ok: boolean
  error: 'missing_config' | 'request_failed' | null
  recordId: string | null
}

export type AirtableDecisionRecord = {
  id: string
  title: string
  status: string
  customerId: string | null
  visitId: string | null
  createdAt: string | null
  values: AirtableDecisionCoreValues
  outcome: DecisionLoopOutcome | null
  validation: DecisionLoopValidation | null
}

export type ListAirtableDecisionsResult = {
  data: AirtableDecisionRecord[]
  error: 'missing_config' | 'request_failed' | null
}

export type GetAirtableDecisionResult = {
  data: AirtableDecisionRecord | null
  error: 'missing_config' | 'request_failed' | 'not_found' | null
}

export type UpdateAirtableDecisionOutcomeInput = {
  decisionId: string
  observedAt: string
  observation: string
  customerReaction: string | null
  validationResult: DecisionValidationResult
}

export type UpdateAirtableDecisionOutcomeResult = {
  ok: boolean
  error: 'missing_config' | 'request_failed' | null
  outcomeId: string | null
  validationId: string | null
}

export type ListOpenNextObservationInput = {
  customerId?: string | null
  visitId?: string | null
  limit?: number
}

const AIRTABLE_API_ORIGIN = 'https://api.airtable.com/v0'

const FIELD_ENV_BY_KEY: Record<DecisionCoreFieldKey, string> = {
  consultationConcern: 'AIRTABLE_DECISION_FIELD_CONSULTATION',
  customerTruth: 'AIRTABLE_DECISION_FIELD_CONFIRMED_FACTS',
  chosenDecision: 'AIRTABLE_DECISION_FIELD_CHOSEN_DECISION',
  notChosen: 'AIRTABLE_DECISION_FIELD_NOT_CHOSEN',
  nextObservation: 'AIRTABLE_DECISION_FIELD_NEXT_OBSERVATION',
}

const DEFAULT_FIELD_BY_KEY: Record<DecisionCoreFieldKey, string> = {
  consultationConcern: '今回の相談',
  customerTruth: '確認した事実',
  chosenDecision: '選んだ方法',
  notChosen: 'あえてしなかったこと',
  nextObservation: '次回確認',
}

const OPTIONAL_FIELD_ENV = {
  customer: 'AIRTABLE_DECISION_FIELD_CUSTOMER',
  visit: 'AIRTABLE_DECISION_FIELD_VISIT',
  outcomeObservedAt: 'AIRTABLE_DECISION_FIELD_OUTCOME_OBSERVED_AT',
  outcomeObservation: 'AIRTABLE_DECISION_FIELD_OUTCOME_OBSERVATION',
  customerReaction: 'AIRTABLE_DECISION_FIELD_CUSTOMER_REACTION',
  validationResult: 'AIRTABLE_DECISION_FIELD_VALIDATION_RESULT',
} as const

const DEFAULT_OPTIONAL_FIELD = {
  customer: '顧客',
  visit: '来店',
  outcomeObservedAt: 'Outcome Observed At',
  outcomeObservation: 'Outcome',
  customerReaction: 'Customer Reaction',
  validationResult: 'Validation',
} as const

const VALIDATION_RESULTS: readonly DecisionValidationResult[] = [
  'supported',
  'partially_supported',
  'contradicted',
  'insufficient_evidence',
]

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function readRequiredEnv(name: string): string {
  const value = readEnv(name)
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function getDecisionTableRef(): string {
  const table = readEnv('AIRTABLE_DECISION_TABLE_ID') ?? readEnv('AIRTABLE_DECISION_TABLE_NAME')
  if (!table) {
    throw new Error('AIRTABLE_DECISION_TABLE_ID or AIRTABLE_DECISION_TABLE_NAME is required')
  }
  return encodeURIComponent(table)
}

function getFieldName(key: DecisionCoreFieldKey): string {
  return readEnv(FIELD_ENV_BY_KEY[key]) ?? DEFAULT_FIELD_BY_KEY[key]
}

function getTitleFieldName(): string {
  return readEnv('AIRTABLE_DECISION_FIELD_TITLE') ?? 'Decisionタイトル'
}

function getStatusFieldName(): string {
  return readEnv('AIRTABLE_DECISION_FIELD_STATUS') ?? '判断状態'
}

function getOptionalFieldName(key: keyof typeof OPTIONAL_FIELD_ENV): string {
  return readEnv(OPTIONAL_FIELD_ENV[key]) ?? DEFAULT_OPTIONAL_FIELD[key]
}

function buildFields(input: CreateAirtableDecisionInput): Record<string, string> {
  const fields: Record<string, string> = {
    [getTitleFieldName()]: input.title,
    [getStatusFieldName()]: input.status,
  }

  Object.entries(input.values).forEach(([key, value]) => {
    if (value) {
      fields[getFieldName(key as DecisionCoreFieldKey)] = value
    }
  })

  return fields
}

function buildOutcomeFields(input: UpdateAirtableDecisionOutcomeInput): Record<string, string> {
  const fields: Record<string, string> = {
    [getOptionalFieldName('outcomeObservedAt')]: input.observedAt,
    [getOptionalFieldName('outcomeObservation')]: input.observation,
    [getOptionalFieldName('validationResult')]: input.validationResult,
  }

  if (input.customerReaction) {
    fields[getOptionalFieldName('customerReaction')] = input.customerReaction
  }

  return fields
}

function readStringField(fields: Record<string, unknown>, fieldName: string): string {
  const value = fields[fieldName]
  return typeof value === 'string' ? value : ''
}

function readLinkedRecordId(fields: Record<string, unknown>, fieldName: string): string | null {
  const value = fields[fieldName]
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!Array.isArray(value)) return null

  const firstValue = value[0]
  if (typeof firstValue === 'string' && firstValue.trim()) return firstValue.trim()
  return null
}

function readValidationResult(fields: Record<string, unknown>): DecisionValidationResult | null {
  const value = fields[getOptionalFieldName('validationResult')]
  const result = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'name' in value && typeof value.name === 'string'
      ? value.name
      : null

  return result && VALIDATION_RESULTS.includes(result as DecisionValidationResult)
    ? result as DecisionValidationResult
    : null
}

function buildOutcome(
  recordId: string,
  fields: Record<string, unknown>,
): DecisionLoopOutcome | null {
  const observation = readStringField(fields, getOptionalFieldName('outcomeObservation')) || null
  const observedAt = readStringField(fields, getOptionalFieldName('outcomeObservedAt')) || null
  if (!observation || !observedAt) return null

  return {
    outcomeId: `outcome_${recordId}`,
    decisionId: recordId,
    visitId: readLinkedRecordId(fields, getOptionalFieldName('visit')),
    observedAt,
    observation,
    customerReaction: readStringField(fields, getOptionalFieldName('customerReaction')) || null,
  }
}

function buildValidation(
  recordId: string,
  outcome: DecisionLoopOutcome | null,
  fields: Record<string, unknown>,
): DecisionLoopValidation | null {
  const result = readValidationResult(fields)
  if (!outcome || !result) return null

  return {
    validationId: `validation_${recordId}`,
    decisionId: recordId,
    outcomeId: outcome.outcomeId,
    result,
  }
}

function mapRecord(record: { id?: unknown; fields?: unknown; createdTime?: unknown }): AirtableDecisionRecord | null {
  if (typeof record.id !== 'string' || !record.fields || typeof record.fields !== 'object') {
    return null
  }

  const fields = record.fields as Record<string, unknown>
  const values = {} as AirtableDecisionCoreValues
  const outcome = buildOutcome(record.id, fields)

  ;(Object.keys(DEFAULT_FIELD_BY_KEY) as DecisionCoreFieldKey[]).forEach((key) => {
    const value = readStringField(fields, getFieldName(key))
    values[key] = value || null
  })

  return {
    id: record.id,
    title: readStringField(fields, getTitleFieldName()),
    status: readStringField(fields, getStatusFieldName()),
    customerId: readLinkedRecordId(fields, getOptionalFieldName('customer')),
    visitId: readLinkedRecordId(fields, getOptionalFieldName('visit')),
    createdAt: typeof record.createdTime === 'string' ? record.createdTime : null,
    values,
    outcome,
    validation: buildValidation(record.id, outcome, fields),
  }
}

function readAirtableConfig(): { token: string; baseId: string; tableRef: string } | null {
  try {
    return {
      token: readRequiredEnv('AIRTABLE_TOKEN'),
      baseId: readRequiredEnv('AIRTABLE_BASE_ID'),
      tableRef: getDecisionTableRef(),
    }
  } catch {
    return null
  }
}

export async function createAirtableDecisionRecord(
  input: CreateAirtableDecisionInput,
): Promise<CreateAirtableDecisionResult> {
  const config = readAirtableConfig()
  if (!config) {
    return { ok: false, error: 'missing_config', recordId: null }
  }

  try {
    const response = await fetch(`${AIRTABLE_API_ORIGIN}/${config.baseId}/${config.tableRef}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields: buildFields(input) }],
        typecast: false,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { ok: false, error: 'request_failed', recordId: null }
    }

    const body = await response.json().catch(() => null) as {
      records?: Array<{ id?: unknown }>
    } | null
    if (!body?.records || body.records.length !== 1) {
      return { ok: false, error: 'request_failed', recordId: null }
    }

    const recordId = body.records[0]?.id
    if (typeof recordId !== 'string') {
      return { ok: false, error: 'request_failed', recordId: null }
    }

    return { ok: true, error: null, recordId }
  } catch {
    return { ok: false, error: 'request_failed', recordId: null }
  }
}

export async function listAirtableDecisionRecords(
  limit = 12,
): Promise<ListAirtableDecisionsResult> {
  const config = readAirtableConfig()
  if (!config) {
    return { data: [], error: 'missing_config' }
  }

  try {
    const params = new URLSearchParams({
      maxRecords: String(Math.max(1, Math.min(limit, 50))),
      pageSize: String(Math.max(1, Math.min(limit, 50))),
    })
    params.set('sort[0][field]', getTitleFieldName())
    params.set('sort[0][direction]', 'desc')

    const response = await fetch(
      `${AIRTABLE_API_ORIGIN}/${config.baseId}/${config.tableRef}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return { data: [], error: 'request_failed' }
    }

    const body = await response.json().catch(() => null) as {
      records?: Array<{ id?: unknown; fields?: unknown; createdTime?: unknown }>
    } | null

    if (!body?.records) {
      return { data: [], error: 'request_failed' }
    }

    return {
      data: body.records.map(mapRecord).filter((record): record is AirtableDecisionRecord => record !== null),
      error: null,
    }
  } catch {
    return { data: [], error: 'request_failed' }
  }
}

export async function getAirtableDecisionRecord(recordId: string): Promise<GetAirtableDecisionResult> {
  const config = readAirtableConfig()
  if (!config) {
    return { data: null, error: 'missing_config' }
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API_ORIGIN}/${config.baseId}/${config.tableRef}/${encodeURIComponent(recordId)}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
        cache: 'no-store',
      },
    )

    if (response.status === 404) {
      return { data: null, error: 'not_found' }
    }

    if (!response.ok) {
      return { data: null, error: 'request_failed' }
    }

    const body = await response.json().catch(() => null) as {
      id?: unknown
      fields?: unknown
      createdTime?: unknown
    } | null

    const data = body ? mapRecord(body) : null
    return data ? { data, error: null } : { data: null, error: 'request_failed' }
  } catch {
    return { data: null, error: 'request_failed' }
  }
}

export async function updateAirtableDecisionOutcomeValidation(
  input: UpdateAirtableDecisionOutcomeInput,
): Promise<UpdateAirtableDecisionOutcomeResult> {
  const config = readAirtableConfig()
  if (!config) {
    return { ok: false, error: 'missing_config', outcomeId: null, validationId: null }
  }

  try {
    const response = await fetch(`${AIRTABLE_API_ORIGIN}/${config.baseId}/${config.tableRef}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          id: input.decisionId,
          fields: buildOutcomeFields(input),
        }],
        typecast: false,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { ok: false, error: 'request_failed', outcomeId: null, validationId: null }
    }

    const body = await response.json().catch(() => null) as {
      records?: Array<{ id?: unknown }>
    } | null
    const recordId = body?.records?.[0]?.id
    if (typeof recordId !== 'string') {
      return { ok: false, error: 'request_failed', outcomeId: null, validationId: null }
    }

    return {
      ok: true,
      error: null,
      outcomeId: `outcome_${recordId}`,
      validationId: `validation_${recordId}`,
    }
  } catch {
    return { ok: false, error: 'request_failed', outcomeId: null, validationId: null }
  }
}

export async function listOpenNextObservationDecisionRecords(
  input: ListOpenNextObservationInput = {},
): Promise<ListAirtableDecisionsResult> {
  const result = await listAirtableDecisionRecords(input.limit ?? 30)
  return {
    ...result,
    data: result.data.filter((decision) =>
      Boolean(decision.values.nextObservation)
      && decision.outcome === null
      && (!input.customerId || decision.customerId === input.customerId)
      && (!input.visitId || decision.visitId === input.visitId),
    ),
  }
}
