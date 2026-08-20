import type { EvidenceRef } from '@/lib/types/ai-operations'

export type RevenueSignalSourceType =
  | 'DECISION'
  | 'CASE'
  | 'KNOWLEDGE'
  | 'CONTENT'
  | 'WORKFLOW'
  | 'CUSTOMER'
  | 'VISIT'

export type RevenueSignalType =
  | 'SALON_VALUE'
  | 'CUSTOMER_INTEREST'
  | 'CONTENT_INTEREST'
  | 'SEARCH_DISCOVERY'
  | 'CONSULTATION'
  | 'BOOKING'
  | 'PURCHASE'
  | 'REPEAT_USE'
  | 'KNOWLEDGE_REUSE'
  | 'PRODUCTIZATION_SIGNAL'

export type RevenueSignalConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export type RevenueEvidenceClass = 'REAL' | 'SAMPLE' | 'TEST' | 'UNKNOWN'

export type RevenueSignalStatus =
  | 'OBSERVED'
  | 'NEEDS_VALIDATION'
  | 'VALIDATED'
  | 'RETIRED'

export type RevenueSignal = {
  id: string
  sourceType: RevenueSignalSourceType
  sourceId: string
  signalType: RevenueSignalType
  value: string | number | boolean | null
  confidence: RevenueSignalConfidence
  evidenceClass: RevenueEvidenceClass
  evidenceRefs: readonly EvidenceRef[]
  observedAt: string | null
  status: RevenueSignalStatus
}

export type RevenueSourceCoverageStatus = 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR'

export type RevenueSourceCoverage = {
  sourceType: RevenueSignalSourceType
  label: string
  status: RevenueSourceCoverageStatus
  evidenceClass: RevenueEvidenceClass
  totalCount: number | null
  realCount: number | null
  sampleTestExcludedCount: number
  unknownExcludedCount: number
  notes: readonly string[]
}

export type RevenueIntelligenceProjection = {
  signals: readonly RevenueSignal[]
  realSignalCount: number
  sampleExcludedCount: number
  testExcludedCount: number
  unknownExcludedCount: number
  sampleTestExcludedCount: number
  needsValidationCount: number
  productizationSignalCount: number
  sourceCoverage: readonly RevenueSourceCoverage[]
  dataQualityNotes: readonly string[]
  errors: readonly string[]
}
