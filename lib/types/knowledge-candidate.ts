import type { DecisionCoreFieldKey } from '@/lib/types/decision'

export type KnowledgeEvidenceClass = 'REAL' | 'SAMPLE' | 'TEST' | 'UNKNOWN'

export type KnowledgeCandidateValidationStatus =
  | 'UNVALIDATED'
  | 'PARTIALLY_VALIDATED'
  | 'VALIDATED'
  | 'CONTRADICTED'

export type KnowledgeCaseValidationState =
  | 'UNOBSERVED'
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'UNKNOWN'

export type KnowledgeCandidateConfidence = 'LOW' | 'MEDIUM' | 'HIGH'

export type KnowledgeCaseSourceKind =
  | 'airtable'
  | 'fixture'
  | 'demo'
  | 'synthetic'
  | 'unknown'

export type KnowledgeDecisionCaseValues = Partial<Record<DecisionCoreFieldKey, string | null>>

export type KnowledgeDecisionCase = {
  decisionId: string
  title?: string | null
  values: KnowledgeDecisionCaseValues
  evidenceClass: KnowledgeEvidenceClass
  sourceKind?: KnowledgeCaseSourceKind
  outcome?: string | null
  validation?: KnowledgeCaseValidationState | null
  observedAt?: string | null
}

export type KnowledgeCandidate = {
  candidateId: string
  title: string
  statement: string
  conditions: readonly string[]
  nonConditions: readonly string[]
  evidenceDecisionIds: readonly string[]
  supportingCount: number
  counterEvidenceDecisionIds: readonly string[]
  validationStatus: KnowledgeCandidateValidationStatus
  confidence: KnowledgeCandidateConfidence
  reasoningSummary: string
  createdAt: string
  updatedAt: string
}

export type KnowledgeCandidateNoActionReason =
  | 'TARGET_NOT_REAL'
  | 'INSUFFICIENT_REAL_CASES'
  | 'INSUFFICIENT_SIMILARITY'

export type KnowledgeCandidateEvaluation =
  | {
    status: 'NO_ACTION'
    reason: KnowledgeCandidateNoActionReason
    candidate: null
  }
  | {
    status: 'CANDIDATE_REVIEW'
    reason: 'MULTIPLE_SIMILAR_REAL_CASES'
    candidate: KnowledgeCandidate
  }
