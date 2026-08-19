import type { DecisionCoreFieldKey } from '@/lib/types/decision'

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
  values: AirtableDecisionCoreValues
}

export type ListAirtableDecisionsResult = {
  data: AirtableDecisionRecord[]
  error: 'missing_config' | 'request_failed' | null
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

function readStringField(fields: Record<string, unknown>, fieldName: string): string {
  const value = fields[fieldName]
  return typeof value === 'string' ? value : ''
}

function mapRecord(record: { id?: unknown; fields?: unknown }): AirtableDecisionRecord | null {
  if (typeof record.id !== 'string' || !record.fields || typeof record.fields !== 'object') {
    return null
  }

  const fields = record.fields as Record<string, unknown>
  const values = {} as AirtableDecisionCoreValues

  ;(Object.keys(DEFAULT_FIELD_BY_KEY) as DecisionCoreFieldKey[]).forEach((key) => {
    const value = readStringField(fields, getFieldName(key))
    values[key] = value || null
  })

  return {
    id: record.id,
    title: readStringField(fields, getTitleFieldName()),
    status: readStringField(fields, getStatusFieldName()),
    values,
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
      records?: Array<{ id?: unknown; fields?: unknown }>
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
