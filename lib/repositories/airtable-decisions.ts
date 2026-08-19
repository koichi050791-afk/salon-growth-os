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

function buildFields(input: CreateAirtableDecisionInput): Record<string, string> {
  const titleField = readEnv('AIRTABLE_DECISION_FIELD_TITLE') ?? 'Decisionタイトル'
  const statusField = readEnv('AIRTABLE_DECISION_FIELD_STATUS') ?? '判断状態'

  const fields: Record<string, string> = {
    [titleField]: input.title,
    [statusField]: input.status,
  }

  Object.entries(input.values).forEach(([key, value]) => {
    if (value) {
      fields[getFieldName(key as DecisionCoreFieldKey)] = value
    }
  })

  return fields
}

export async function createAirtableDecisionRecord(
  input: CreateAirtableDecisionInput,
): Promise<CreateAirtableDecisionResult> {
  let token: string
  let baseId: string
  let tableRef: string

  try {
    token = readRequiredEnv('AIRTABLE_TOKEN')
    baseId = readRequiredEnv('AIRTABLE_BASE_ID')
    tableRef = getDecisionTableRef()
  } catch {
    return { ok: false, error: 'missing_config' }
  }

  try {
    const response = await fetch(`${AIRTABLE_API_ORIGIN}/${baseId}/${tableRef}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{ fields: buildFields(input) }],
        typecast: false,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return { ok: false, error: 'request_failed' }
    }

    const body = await response.json().catch(() => null) as { records?: unknown[] } | null
    if (!body?.records || body.records.length !== 1) {
      return { ok: false, error: 'request_failed' }
    }

    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'request_failed' }
  }
}
