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

export type RegistryTarget = 'orchestrator' | 'all-core-agents' | CoreAgentId

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
  title: string
  sourceOperationId: AiOperationId | null
  approvalLevel: Extract<ApprovalLevel, 'REVIEW' | 'APPROVAL'>
  summary: string
  requiredAction: string
  sourceRefs: readonly string[]
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
