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

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function isTestDecision(decision: AirtableDecisionRecord): boolean {
  const consultation = decision.values.consultationConcern ?? ''
  return TEST_DECISION_PREFIXES.some((prefix) => consultation.startsWith(prefix))
}

function isOperationalCustomer(customer: CustomerGrowthRecord): boolean {
  return customer.dataKind?.toLowerCase() !== 'sample'
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

function buildDecisionConsultationSignal(decision: AirtableDecisionRecord): RevenueSignal | null {
  if (!decision.values.consultationConcern) return null

  const evidenceRef = buildEvidenceRef({
    id: `airtable_decision_${stableHash(decision.id)}`,
    source: 'airtable',
    label: 'Airtable Decision',
    recordId: decision.id,
    observedAt: decision.createdAt,
  })

  return {
    id: `revenue_signal_${stableHash(`DECISION:${decision.id}:CONSULTATION`)}`,
    sourceType: 'DECISION',
    sourceId: decision.id,
    signalType: 'CONSULTATION',
    value: true,
    confidence: 'LOW',
    evidenceClass: 'REAL',
    evidenceRefs: [evidenceRef],
    observedAt: decision.createdAt,
    status: 'NEEDS_VALIDATION',
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
  const operationalDecisions = input.decisions.data.filter((decision) => !isTestDecision(decision))
  const testDecisions = input.decisions.data.length - operationalDecisions.length
  const operationalCustomers = input.customerGrowth.data.filter(isOperationalCustomer)
  const sampleCustomers = input.customerGrowth.data.length - operationalCustomers.length

  const decisionSignals = operationalDecisions
    .map(buildDecisionConsultationSignal)
    .filter((signal): signal is RevenueSignal => signal !== null)
  const customerSignals = operationalCustomers
    .map(buildCustomerBookingSignal)
    .filter((signal): signal is RevenueSignal => signal !== null)
  const signals = [...decisionSignals, ...customerSignals]
  const dataQualityNotes = contentDataQualityNotes(input.contentRegistry)
  const errors = [
    input.contentRegistry.error ? `Content Registry: ${input.contentRegistry.error}` : null,
    input.decisions.error ? `Decision: ${input.decisions.error}` : null,
    input.customerGrowth.error ? `Customer Growth: ${input.customerGrowth.error}` : null,
  ].filter((error): error is string => error !== null)

  return {
    signals,
    realSignalCount: signals.filter((signal) => signal.evidenceClass === 'REAL').length,
    sampleTestExcludedCount: testDecisions + sampleCustomers,
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
        evidenceClass: 'REAL',
        totalCount: input.decisions.error === null ? input.decisions.data.length : null,
        realCount: input.decisions.error === null ? operationalDecisions.length : null,
        sampleTestExcludedCount: testDecisions,
        notes: ['Consultation signals remain NEEDS_VALIDATION and do not imply revenue causality.'],
      }),
      coverage({
        sourceType: 'CUSTOMER',
        label: 'Airtable Customer Growth',
        connected: input.customerGrowth.error === null,
        error: input.customerGrowth.error === 'request_failed',
        evidenceClass: 'REAL',
        totalCount: input.customerGrowth.error === null ? input.customerGrowth.data.length : null,
        realCount: input.customerGrowth.error === null ? operationalCustomers.length : null,
        sampleTestExcludedCount: sampleCustomers,
        notes: ['Customer names are not projected into Revenue Intelligence.'],
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
