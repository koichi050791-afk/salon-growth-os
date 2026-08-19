import type { DecisionCoreFieldKey, DecisionFieldState } from '@/lib/types/decision'

export type ApprovalLevel = 'AUTO' | 'REVIEW' | 'APPROVAL'

export type AiOperationStatus = 'RUNNING' | 'WATCHING' | 'REVIEW' | 'APPROVAL'

export type WorkEventType =
  | 'DecisionCaptured'
  | 'DailyReportCaptured'
  | 'KnowledgeCandidateDetected'
  | 'ContentCandidateDetected'
  | 'EngineeringCandidateDetected'

export type CoreAgentId =
  | 'salon-customer-intelligence'
  | 'decision-learning-intelligence'
  | 'growth-market-intelligence'
  | 'content-product-intelligence'

export type SharedCapabilityId =
  | 'quality-brand-qa'
  | 'approval-policy'
  | 'evidence-resolver'
  | 'trigger-scheduler'
  | 'run-history'

export type AiOperationId =
  | 'morning-executive-brief'
  | 'daily-close'
  | 'weekly-board-review'

export type ApprovalQueueItemType =
  | 'professional_hypothesis_candidate'
  | 'future_plan_candidate'
  | 'experiment_candidate'
  | 'content_draft_candidate'
  | 'customer_state_candidate'
  | 'knowledge_candidate'
  | 'engineering_candidate'
  | 'publication_candidate'
  | 'policy_change_candidate'

export type ApprovalQueueStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'SUPERSEDED'

export type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export type ApprovalReversibility = 'REVERSIBLE' | 'PARTIAL' | 'IRREVERSIBLE'

export type WorkGraphSource = 'airtable' | 'drive' | 'notion' | 'github' | 'internal' | 'chatgpt'

export type RegistryTarget = 'orchestrator' | 'all-core-agents' | CoreAgentId

export type EvidenceRef = {
  id: string
  source: WorkGraphSource
  label: string
  recordId?: string | null
  field?: string | null
  observedAt?: string | null
  url?: string | null
}

export type ChatGptOrchestratorDefinition = {
  id: 'chatgpt-chief-of-staff'
  displayName: string
  role: 'orchestrator'
  notCountedAsCoreAgent: true
  responsibilities: readonly string[]
  routesThrough: readonly SharedCapabilityId[]
}

export type CoreAgentDefinition = {
  id: CoreAgentId
  displayName: string
  responsibilities: readonly string[]
  acceptedEvents: readonly WorkEventType[]
  inputs: readonly string[]
  outputs: readonly string[]
  defaultApprovalLevel: ApprovalLevel
  downstream: readonly (CoreAgentId | SharedCapabilityId)[]
  enabled: boolean
  guardrails: readonly string[]
  primarySources: readonly string[]
}

export type SharedCapabilityDefinition = {
  id: SharedCapabilityId
  displayName: string
  appliesTo: readonly RegistryTarget[]
  inputContract: string
  outputContract: string
  failureBehavior: string
}

export type AiOperationDefinition = {
  id: AiOperationId
  displayName: string
  trigger: string
  status: AiOperationStatus
  summary: string
  lastResult: string | null
  nextAction: string
  ownerAgentIds: readonly CoreAgentId[]
  sharedCapabilityIds: readonly SharedCapabilityId[]
  approvalLevel: ApprovalLevel
}

export type ApprovalQueueItem = {
  id: string
  type: ApprovalQueueItemType
  title: string
  summary: string
  reasonForHuman: string
  evidenceRefs: readonly EvidenceRef[]
  proposedAction: string
  approvalLevel: Extract<ApprovalLevel, 'REVIEW' | 'APPROVAL'>
  risk: ApprovalRisk
  reversibility: ApprovalReversibility
  createdAt: string
  expiresAt?: string | null
  status: ApprovalQueueStatus
  sourceAgent: CoreAgentId
  sourceEvent: WorkGraphEventRef
}

export type WorkGraphEventRef = {
  id: string
  type: WorkEventType
}

export type DecisionCapturedEvent = {
  id: string
  type: 'DecisionCaptured'
  occurredAt: string
  source: 'airtable'
  sourceRefs: readonly EvidenceRef[]
  payload: {
    decisionRecordId: string | null
    title: string
    fieldState: Record<DecisionCoreFieldKey, DecisionFieldState>
    containsProfessionalHypothesis: false
  }
}

export type WorkGraphCandidatePayload = {
  title?: string
  summary?: string
  reasonForHuman?: string
  proposedAction?: string
  evidenceRefs?: readonly EvidenceRef[]
  risk?: ApprovalRisk
  reversibility?: ApprovalReversibility
  expiresAt?: string | null
}

export type CandidateWorkGraphEvent = {
  id: string
  type: Exclude<WorkEventType, 'DecisionCaptured'>
  occurredAt: string
  source: WorkGraphSource
  sourceRefs: readonly EvidenceRef[]
  payload: WorkGraphCandidatePayload
}

export type WorkGraphEvent = DecisionCapturedEvent | CandidateWorkGraphEvent

export type WorkGraphAgentRunStatus = 'SUCCESS' | 'SKIPPED' | 'FAILED'

export type WorkGraphAgentRunResult = {
  agentId: CoreAgentId
  eventType: WorkEventType
  status: WorkGraphAgentRunStatus
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
  approvalQueueItems: readonly ApprovalQueueItem[]
  autoWorkCount: number
  error: 'dispatch_failed' | null
}

export type WorkGraphRoutingPreview = {
  eventType: WorkEventType
  targetAgentIds: readonly CoreAgentId[]
  sharedCapabilityIds: readonly SharedCapabilityId[]
  approvalLevel: ApprovalLevel
  duplicatesSourceData: false
  sourceRefPolicy: string
}

export type AiOperationsControlCenter = {
  todayLabel: string
  orchestrator: ChatGptOrchestratorDefinition
  coreAgents: readonly CoreAgentDefinition[]
  sharedCapabilities: readonly SharedCapabilityDefinition[]
  operations: readonly AiOperationDefinition[]
  approvalQueue: readonly ApprovalQueueItem[]
  routingPreviews: readonly WorkGraphRoutingPreview[]
  boundaryNotes: readonly string[]
}
