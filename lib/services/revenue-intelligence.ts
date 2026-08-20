import type {
  AirtableDecisionRecord,
  ListAirtableDecisionsResult,
} from '@/lib/repositories/airtable-decisions'
import type {
  CustomerGrowthRecord,
  ListCustomerGrowthResult,
} from '@/lib/repositories/airtable-customer-growth'
import type { ContentRegistryReadResult } from '@/lib/types/content-source'
import type { EvidenceRef } from '@/lib/types/ai-operations'
import type {
  RevenueEvidenceClass,
  RevenueIntelligenceProjection,
  RevenueSignal,
  RevenueSignalSourceType,
  RevenueSourceCoverage,
} from '@/lib/types/revenue-intelligence'

type BuildRevenueProjectionInput = {
  contentRegistry: ContentRegistryReadResult
  decisions: ListAirtableDecisionsResult
  customerGrowth: ListCustomerGrowthResult
}

const TEST_DECISION_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']
const SAMPLE_DECISION_PREFIXES = ['【SAMPLE】']
const REAL_DATA_KIND_VALUES = ['real', 'production', 'operational', '実データ', '本番']
const SAMPLE_DATA_KIND_VALUES = ['sample', 'サンプル']
const TEST_DATA_KIND_VALUES = ['test', 'テスト']
const UNKNOWN_DATA_KIND_VALUES = ['unknown', '不明', '未確認']

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix))
}

export function classifyDecisionEvidence(decision: AirtableDecisionRecord): RevenueEvidenceClass {
  const consultation = decision.values.consultationConcern ?? ''
  if (startsWithAny(consultation, TEST_DECISION_PREFIXES)) return 'TEST'
  if (startsWithAny(consultation, SAMPLE_DECISION_PREFIXES)) return 'SAMPLE'

  return 'UNKNOWN'
}

function normalizeDataKind(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

export function classifyCustomerEvidence(customer: CustomerGrowthRecord): RevenueEvidenceClass {
  const dataKind = normalizeDataKind(customer.dataKind)
  if (!dataKind) return 'UNKNOWN'
  if (REAL_DATA_KIND_VALUES.includes(dataKind)) return 'REAL'
  if (SAMPLE_DATA_KIND_VALUES.includes(dataKind)) return 'SAMPLE'
  if (TEST_DATA_KIND_VALUES.includes(dataKind)) return 'TEST'
  if (UNKNOWN_DATA_KIND_VALUES.includes(dataKind)) return 'UNKNOWN'

  return 'UNKNOWN'
}

function countEvidenceClasses(items: readonly RevenueEvidenceClass[]): Record<RevenueEvidenceClass, number> {
  return {
    REAL: items.filter((item) => item === 'REAL').length,
    SAMPLE: items.filter((item) => item === 'SAMPLE').length,
    TEST: items.filter((item) => item === 'TEST').length,
    UNKNOWN: items.filter((item) => item === 'UNKNOWN').length,
  }
}

function buildEvidenceRef(input: {
  id: string
  source: EvidenceRef['source']
  label: string
  recordId: string
  observedAt: string | null
}): EvidenceRef {
  return {
    id: input.id,
    source: input.source,
    label: input.label,
    recordId: input.recordId,
    observedAt: input.observedAt,
  }
}

function buildCustomerBookingSignal(customer: CustomerGrowthRecord): RevenueSignal | null {
  if (customer.nextPlanStatus !== 'BOOKED') return null

  const evidenceRef = buildEvidenceRef({
    id: `airtable_customer_${stableHash(customer.id)}`,
    source: 'airtable',
    label: 'Airtable Customer Growth',
    recordId: customer.id,
    observedAt: customer.lastVisitDate,
  })

  return {
    id: `revenue_signal_${stableHash(`CUSTOMER:${customer.id}:BOOKING`)}`,
    sourceType: 'CUSTOMER',
    sourceId: customer.id,
    signalType: 'BOOKING',
    value: true,
    confidence: 'HIGH',
    evidenceClass: 'REAL',
    evidenceRefs: [evidenceRef],
    observedAt: customer.lastVisitDate,
    status: 'OBSERVED',
  }
}

function coverage(input: {
  sourceType: RevenueSignalSourceType
  label: string
  connected: boolean
  error: boolean
  evidenceClass: RevenueEvidenceClass
  totalCount: number | null
  realCount: number | null
  sampleTestExcludedCount?: number
  unknownExcludedCount?: number
  notes?: readonly string[]
}): RevenueSourceCoverage {
  return {
    sourceType: input.sourceType,
    label: input.label,
    status: input.error ? 'ERROR' : input.connected ? 'CONNECTED' : 'NOT_CONNECTED',
    evidenceClass: input.connected && !input.error ? input.evidenceClass : 'UNKNOWN',
    totalCount: input.totalCount,
    realCount: input.realCount,
    sampleTestExcludedCount: input.sampleTestExcludedCount ?? 0,
    unknownExcludedCount: input.unknownExcludedCount ?? 0,
    notes: input.notes ?? [],
  }
}

function contentDataQualityNotes(contentRegistry: ContentRegistryReadResult): readonly string[] {
  const notes: string[] = []
  const link0007 = contentRegistry.data.find((item) => item.id === 'LINK-0007')

  if (link0007 && !link0007.publicUrl) {
    notes.push('LINK-0007 public URL missing in REAL Content Registry.')
  }

  return notes
}

export function buildRevenueIntelligenceProjection(
  input: BuildRevenueProjectionInput,
): RevenueIntelligenceProjection {
  const decisionEvidenceCounts = countEvidenceClasses(input.decisions.data.map(classifyDecisionEvidence))
  const customerEvidenceCounts = countEvidenceClasses(input.customerGrowth.data.map(classifyCustomerEvidence))
  const realCustomers = input.customerGrowth.data.filter((customer) => classifyCustomerEvidence(customer) === 'REAL')
  const sampleExcludedCount = decisionEvidenceCounts.SAMPLE + customerEvidenceCounts.SAMPLE
  const testExcludedCount = decisionEvidenceCounts.TEST + customerEvidenceCounts.TEST
  const unknownExcludedCount = decisionEvidenceCounts.UNKNOWN + customerEvidenceCounts.UNKNOWN

  const customerSignals = realCustomers
    .map(buildCustomerBookingSignal)
    .filter((signal): signal is RevenueSignal => signal !== null)
  const signals = [...customerSignals]
  const dataQualityNotes = contentDataQualityNotes(input.contentRegistry)
  const errors = [
    input.contentRegistry.error ? `Content Registry: ${input.contentRegistry.error}` : null,
    input.decisions.error ? `Decision: ${input.decisions.error}` : null,
    input.customerGrowth.error ? `Customer Growth: ${input.customerGrowth.error}` : null,
  ].filter((error): error is string => error !== null)

  return {
    signals,
    realSignalCount: signals.filter((signal) => signal.evidenceClass === 'REAL').length,
    sampleExcludedCount,
    testExcludedCount,
    unknownExcludedCount,
    sampleTestExcludedCount: sampleExcludedCount + testExcludedCount,
    needsValidationCount: signals.filter((signal) => signal.status === 'NEEDS_VALIDATION').length,
    productizationSignalCount: signals.filter((signal) => signal.signalType === 'PRODUCTIZATION_SIGNAL').length,
    sourceCoverage: [
      coverage({
        sourceType: 'CONTENT',
        label: 'Content Registry',
        connected: input.contentRegistry.error === null,
        error: input.contentRegistry.error === 'read_failed',
        evidenceClass: 'REAL',
        totalCount: input.contentRegistry.error === null ? input.contentRegistry.data.length : null,
        realCount: input.contentRegistry.error === null ? input.contentRegistry.data.length : null,
        notes: [
          'Content existence is not projected as a Revenue Signal.',
          ...dataQualityNotes,
        ],
      }),
      coverage({
        sourceType: 'DECISION',
        label: 'Airtable Decision',
        connected: input.decisions.error === null,
        error: input.decisions.error === 'request_failed',
        evidenceClass: decisionEvidenceCounts.REAL > 0 ? 'REAL' : 'UNKNOWN',
        totalCount: input.decisions.error === null ? input.decisions.data.length : null,
        realCount: input.decisions.error === null ? decisionEvidenceCounts.REAL : null,
        sampleTestExcludedCount: decisionEvidenceCounts.SAMPLE + decisionEvidenceCounts.TEST,
        unknownExcludedCount: decisionEvidenceCounts.UNKNOWN,
        notes: [
          'Decision consultation text is Decision Evidence, not a Revenue Signal by itself.',
          'No existing Decision field explicitly classifies REAL revenue evidence in this branch.',
        ],
      }),
      coverage({
        sourceType: 'CUSTOMER',
        label: 'Airtable Customer Growth',
        connected: input.customerGrowth.error === null,
        error: input.customerGrowth.error === 'request_failed',
        evidenceClass: customerEvidenceCounts.REAL > 0 ? 'REAL' : 'UNKNOWN',
        totalCount: input.customerGrowth.error === null ? input.customerGrowth.data.length : null,
        realCount: input.customerGrowth.error === null ? customerEvidenceCounts.REAL : null,
        sampleTestExcludedCount: customerEvidenceCounts.SAMPLE + customerEvidenceCounts.TEST,
        unknownExcludedCount: customerEvidenceCounts.UNKNOWN,
        notes: ['Only explicit REAL dataKind records can produce Booking signals.'],
      }),
      coverage({
        sourceType: 'VISIT',
        label: 'Airtable Visit',
        connected: false,
        error: false,
        evidenceClass: 'UNKNOWN',
        totalCount: null,
        realCount: null,
        notes: ['No Visit repository is connected in this branch.'],
      }),
      coverage({
        sourceType: 'CASE',
        label: 'Treatment Case',
        connected: false,
        error: false,
        evidenceClass: 'UNKNOWN',
        totalCount: null,
        realCount: null,
        notes: ['No Case reader is connected in this branch.'],
      }),
      coverage({
        sourceType: 'KNOWLEDGE',
        label: 'Knowledge',
        connected: false,
        error: false,
        evidenceClass: 'UNKNOWN',
        totalCount: null,
        realCount: null,
        notes: ['No Notion or Knowledge reader is connected in this branch.'],
      }),
      coverage({
        sourceType: 'WORKFLOW',
        label: 'Work Graph',
        connected: false,
        error: false,
        evidenceClass: 'UNKNOWN',
        totalCount: null,
        realCount: null,
        notes: ['T-022 does not add revenue events to Work Graph.'],
      }),
    ],
    dataQualityNotes,
    errors,
  }
}
