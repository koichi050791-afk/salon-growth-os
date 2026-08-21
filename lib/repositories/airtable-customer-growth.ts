import { isRealDataKind } from '@/lib/types/data-kind'

export const CUSTOMER_STATES = ['NEW', 'DEVELOP', 'CORE', 'WATCH', 'DORMANT'] as const
export type CustomerState = (typeof CUSTOMER_STATES)[number]

export const NEXT_PLAN_STATUSES = ['BOOKED', 'PLANNED', 'NONE'] as const
export type NextPlanStatus = (typeof NEXT_PLAN_STATUSES)[number]

export type CustomerGrowthRecord = {
  id: string
  name: string
  customerId: string
  state: CustomerState | null
  expectedCycleDays: number | null
  lastVisitDate: string | null
  expectedReturnDate: string | null
  nextPlanStatus: NextPlanStatus | null
  dataKind: string | null
}

export type ListCustomerGrowthResult = {
  data: CustomerGrowthRecord[]
  error: 'missing_config' | 'request_failed' | null
}

const AIRTABLE_API_ORIGIN = 'https://api.airtable.com/v0'
const DEFAULT_CUSTOMER_TABLE = '顧客'

const FIELD_NAMES = {
  name: '顧客名',
  customerId: '顧客ID',
  state: 'Customer State',
  expectedCycleDays: 'Expected Cycle Days',
  lastVisitDate: 'Last Visit Date',
  expectedReturnDate: 'Expected Return Date',
  nextPlanStatus: 'Next Plan Status',
  dataKind: 'データ区分',
} as const

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function readConfig(): { token: string; baseId: string; tableRef: string } | null {
  const token = readEnv('AIRTABLE_TOKEN')
  const baseId = readEnv('AIRTABLE_BASE_ID')
  const table = readEnv('AIRTABLE_CUSTOMER_TABLE_ID')
    ?? readEnv('AIRTABLE_CUSTOMER_TABLE_NAME')
    ?? DEFAULT_CUSTOMER_TABLE

  if (!token || !baseId) return null

  return {
    token,
    baseId,
    tableRef: encodeURIComponent(table),
  }
}

function readString(fields: Record<string, unknown>, name: string): string | null {
  const value = fields[name]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(fields: Record<string, unknown>, name: string): number | null {
  const value = fields[name]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readCustomerState(fields: Record<string, unknown>): CustomerState | null {
  const value = readString(fields, FIELD_NAMES.state)
  return value && CUSTOMER_STATES.includes(value as CustomerState) ? value as CustomerState : null
}

function readNextPlanStatus(fields: Record<string, unknown>): NextPlanStatus | null {
  const value = readString(fields, FIELD_NAMES.nextPlanStatus)
  return value && NEXT_PLAN_STATUSES.includes(value as NextPlanStatus) ? value as NextPlanStatus : null
}

function mapRecord(record: { id?: unknown; fields?: unknown }): CustomerGrowthRecord | null {
  if (typeof record.id !== 'string' || !record.fields || typeof record.fields !== 'object') {
    return null
  }

  const fields = record.fields as Record<string, unknown>

  return {
    id: record.id,
    name: readString(fields, FIELD_NAMES.name) ?? '名称未設定',
    customerId: readString(fields, FIELD_NAMES.customerId) ?? '',
    state: readCustomerState(fields),
    expectedCycleDays: readNumber(fields, FIELD_NAMES.expectedCycleDays),
    lastVisitDate: readString(fields, FIELD_NAMES.lastVisitDate),
    expectedReturnDate: readString(fields, FIELD_NAMES.expectedReturnDate),
    nextPlanStatus: readNextPlanStatus(fields),
    dataKind: readString(fields, FIELD_NAMES.dataKind),
  }
}

export function isOperationalCustomer(customer: CustomerGrowthRecord): boolean {
  return isRealDataKind(customer.dataKind)
}

export async function listCustomerGrowthRecords(limit = 200): Promise<ListCustomerGrowthResult> {
  const config = readConfig()
  if (!config) return { data: [], error: 'missing_config' }

  try {
    const safeLimit = Math.max(1, Math.min(limit, 500))
    const params = new URLSearchParams({
      maxRecords: String(safeLimit),
      pageSize: String(Math.min(safeLimit, 100)),
    })

    Object.values(FIELD_NAMES).forEach((fieldName) => {
      params.append('fields[]', fieldName)
    })

    const response = await fetch(
      `${AIRTABLE_API_ORIGIN}/${config.baseId}/${config.tableRef}?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${config.token}` },
        cache: 'no-store',
      },
    )

    if (!response.ok) return { data: [], error: 'request_failed' }

    const body = await response.json().catch(() => null) as {
      records?: Array<{ id?: unknown; fields?: unknown }>
    } | null

    if (!body?.records) return { data: [], error: 'request_failed' }

    return {
      data: body.records.map(mapRecord).filter((record): record is CustomerGrowthRecord => record !== null),
      error: null,
    }
  } catch {
    return { data: [], error: 'request_failed' }
  }
}
