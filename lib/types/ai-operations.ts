import type {
  DecisionCaptureSource,
  DecisionCoreFieldKey,
  DecisionDataKind,
  DecisionFieldState,
} from '@/lib/types/decision'

export type WorkGraphSource =
  | 'airtable'
  | 'drive'
  | 'notion'
  | 'github'
  | 'internal'
  | 'chatgpt'

export type CoreAgentId =
  | 'salon-customer-intelligence'
  | 'decision-learning-intelligence'
  | 'growth-market-intelligence'
  | 'content-product-intelligence'

export type SharedCapabilityId =
  | 'evidence-resolver'
  | 'approval-policy'
  | 'run-history'

export type WorkEventType =
  | 'DecisionCaptured'
  | 'NextObservationCreated'

export type ApprovalLevel = 'AUTO' | 'REVIEW' | 'APPROVAL'

export type EvidenceRef = {
  id: string
  source: WorkGraphSource
  label: string
  recordId?: string | null
  field?: string | null
  observedAt?: string | null
  url?: string | null
}

export type CoreAgentDefinition = {
  id: CoreAgentId
  displayName: string
  acceptedEvents: readonly WorkEventType[]
  enabled: boolean
}

export type WorkGraphRoutingPreview = {
  eventType: WorkEventType
  targetAgentIds: readonly CoreAgentId[]
  sharedCapabilityIds: readonly SharedCapabilityId[]
  approvalLevel: ApprovalLevel
  duplicatesSourceData: false
  sourceRefPolicy: string
}

export type DecisionCapturedEvent = {
  id: string
  type: 'DecisionCaptured'
  occurredAt: string
  source: WorkGraphSource
  sourceRefs: readonly EvidenceRef[]
  payload: {
    decisionRecordId: string | null
    title: string
    fieldState: Record<DecisionCoreFieldKey, DecisionFieldState>
    containsProfessionalHypothesis: false
    captureSource?: DecisionCaptureSource
    dataKind: DecisionDataKind
  }
}

export type NextObservationCreatedEvent = {
  id: string
  type: 'NextObservationCreated'
  occurredAt: string
  source: WorkGraphSource
  sourceRefs: readonly EvidenceRef[]
  payload: {
    decisionId: string
  }
}

export type WorkGraphEvent =
  | DecisionCapturedEvent
  | NextObservationCreatedEvent

export type WorkGraphAgentRunResult = {
  agentId: CoreAgentId
  eventType: WorkEventType
  status: 'SUCCESS' | 'SKIPPED'
  approvalLevel: ApprovalLevel
  sharedCapabilityIds: readonly SharedCapabilityId[]
  producedQueueItemIds: readonly string[]
  note: string
}

export type WorkGraphDispatchResult = {
  ok: boolean
  event: WorkGraphEvent
  routedAgentIds: readonly CoreAgentId[]
  sharedCapabilityIds: readonly SharedCapabilityId[]
  agentRuns: readonly WorkGraphAgentRunResult[]
  approvalQueueItems: readonly []
  autoWorkCount: number
  error: 'dispatch_failed' | null
}
