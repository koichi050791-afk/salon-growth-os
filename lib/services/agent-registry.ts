import type {
  ApprovalLevel,
  ChatGptOrchestratorDefinition,
  CoreAgentDefinition,
  CoreAgentId,
  SharedCapabilityDefinition,
  SharedCapabilityId,
  WorkEventType,
  WorkGraphRoutingPreview,
} from '@/lib/types/ai-operations'

export const AI_OPERATION_STATUSES = ['RUNNING', 'WATCHING', 'REVIEW', 'APPROVAL'] as const
export const APPROVAL_LEVELS = ['AUTO', 'REVIEW', 'APPROVAL'] as const

export const CHATGPT_ORCHESTRATOR: ChatGptOrchestratorDefinition = {
  id: 'chatgpt-chief-of-staff',
  displayName: 'ChatGPT / Chief of Staff',
  role: 'orchestrator',
  notCountedAsCoreAgent: true,
  responsibilities: [
    'receive Ikeda input',
    'classify the work',
    'select one or more Core Agents',
    'decide parallel vs sequential execution',
    'preserve source references',
    'route outputs through Shared QA / Approval Policy',
    'return only meaningful REVIEW / APPROVAL items to Ikeda',
  ],
  routesThrough: ['evidence-resolver', 'quality-brand-qa', 'approval-policy', 'run-history'],
}

export const CORE_AGENTS: readonly CoreAgentDefinition[] = [
  {
    id: 'salon-customer-intelligence',
    displayName: 'Salon & Customer Intelligence',
    responsibilities: [
      'Observation / Customer Truth',
      'Visit context',
      'Customer Timeline',
      'Next Observation',
      'customer-state candidates',
    ],
    acceptedEvents: ['DecisionCaptured', 'NextObservationCreated', 'OutcomeCaptured'],
    inputs: [
      'Airtable Customer / Visit / Decision / Future Plan projection',
      'salon input routed from ChatGPT',
    ],
    outputs: [
      'customer timeline context',
      'next observation candidates',
      'customer-state candidates',
    ],
    defaultApprovalLevel: 'REVIEW',
    downstream: ['decision-learning-intelligence', 'evidence-resolver', 'approval-policy', 'run-history'],
    enabled: true,
    guardrails: [
      'never infer missing customer facts',
      'keep source-of-truth facts separate from interpretation',
      'do not copy customer PII into Salon Growth OS',
    ],
    primarySources: ['Airtable Customer', 'Airtable Visit', 'Airtable Decision', 'Airtable Future Plan'],
  },
  {
    id: 'decision-learning-intelligence',
    displayName: 'Decision & Learning Intelligence',
    responsibilities: [
      'Decision / Not Chosen',
      'Professional Hypothesis',
      'Outcome / Validation',
      'Knowledge Candidate',
      'contrary-evidence handling',
    ],
    acceptedEvents: [
      'DecisionCaptured',
      'OutcomeCaptured',
      'ValidationRequested',
      'ValidationCompleted',
      'KnowledgeEvaluationCandidate',
      'KnowledgeCandidateDetected',
    ],
    inputs: ['Airtable Decision projection', 'Outcome / validation events', 'source-linked observations'],
    outputs: ['learning candidate', 'validation question', 'contrary-evidence note'],
    defaultApprovalLevel: 'REVIEW',
    downstream: ['quality-brand-qa', 'approval-policy', 'run-history'],
    enabled: true,
    guardrails: [
      'never generalize from a single case',
      'never promote hypothesis to fact without evidence',
      'Outcome is later observation, not automatic proof',
    ],
    primarySources: ['Airtable Decision', 'Notion Knowledge Candidate when promoted'],
  },
  {
    id: 'growth-market-intelligence',
    displayName: 'Growth & Market Intelligence',
    responsibilities: [
      'KPI / capacity / ticket / repeat observations',
      'Growth Experiment candidates and learning',
      'Sanda-area market / search / AI-search external observation',
    ],
    acceptedEvents: ['DailyReportCaptured', 'DecisionCaptured'],
    inputs: ['Google Drive / Sheets KPI projection', 'Decision learning signal', 'external market observations'],
    outputs: ['growth observation', 'experiment candidate', 'market context'],
    defaultApprovalLevel: 'REVIEW',
    downstream: ['evidence-resolver', 'quality-brand-qa', 'approval-policy', 'run-history'],
    enabled: true,
    guardrails: [
      'external trends do not outrank salon primary evidence',
      'no causal claim from one-day results',
      'no discount-led, overbooking, unnecessary-add-on, or excessive-new-client default strategy',
    ],
    primarySources: ['Google Drive / Sheets KPI', 'approved market observation sources'],
  },
  {
    id: 'content-product-intelligence',
    displayName: 'Content & Product Intelligence',
    responsibilities: [
      'Content Candidate generation and channel transformation',
      'OS friction detection',
      'Engineering Candidate',
      'GitHub / Codex implementation handoff preparation',
    ],
    acceptedEvents: ['DecisionCaptured', 'ContentCandidateDetected', 'EngineeringCandidateDetected'],
    inputs: ['Decision / Learning signal', 'approved Knowledge candidate', 'GitHub issue context'],
    outputs: ['content candidate', 'engineering candidate', 'Codex handoff packet'],
    defaultApprovalLevel: 'APPROVAL',
    downstream: ['quality-brand-qa', 'approval-policy', 'run-history'],
    enabled: true,
    guardrails: [
      'no fabricated case or customer detail',
      'publication remains APPROVAL',
      'development activity is not a business outcome',
    ],
    primarySources: ['Airtable Decision projection', 'Notion', 'GitHub'],
  },
]

export const SHARED_CAPABILITIES: readonly SharedCapabilityDefinition[] = [
  {
    id: 'quality-brand-qa',
    displayName: 'Quality & Brand QA',
    appliesTo: ['all-core-agents'],
    inputContract: 'agent output with sourceRefs, fact / hypothesis boundaries, and intended audience',
    outputContract: 'QA result with unsupported-fact, overgeneralization, brand, and fabricated-case checks',
    failureBehavior: 'block REVIEW / APPROVAL output and surface missing evidence',
  },
  {
    id: 'approval-policy',
    displayName: 'Approval Policy',
    appliesTo: ['orchestrator', 'all-core-agents'],
    inputContract: 'candidate output, risk level, reversibility, and destination',
    outputContract: 'AUTO / REVIEW / APPROVAL decision with reason',
    failureBehavior: 'default to REVIEW when risk or evidence is unclear',
  },
  {
    id: 'evidence-resolver',
    displayName: 'Evidence Resolver',
    appliesTo: ['orchestrator', 'all-core-agents'],
    inputContract: 'source references from Airtable / Drive / Notion / GitHub / internal events',
    outputContract: 'deduplicated sourceRefs with missing or stale source markers',
    failureBehavior: 'preserve the original event and mark downstream context partial',
  },
  {
    id: 'trigger-scheduler',
    displayName: 'Trigger / Scheduler',
    appliesTo: ['orchestrator'],
    inputContract: 'scheduled, event, or condition trigger definition',
    outputContract: 'operation trigger envelope without Gmail or Google Calendar dependency',
    failureBehavior: 'skip the operation and record SKIPPED once Run History is connected',
  },
  {
    id: 'run-history',
    displayName: 'Run History',
    appliesTo: ['orchestrator', 'all-core-agents'],
    inputContract: 'operation id, trigger, status, result summary, and error class when present',
    outputContract: 'SUCCESS / PARTIAL / FAILED / SKIPPED record',
    failureBehavior: 'do not mutate the source record; surface history as unknown',
  },
]

const EVENT_APPROVAL_LEVELS: Record<WorkEventType, ApprovalLevel> = {
  DecisionCaptured: 'AUTO',
  NextObservationCreated: 'AUTO',
  OutcomeCaptured: 'AUTO',
  ValidationRequested: 'AUTO',
  ValidationCompleted: 'AUTO',
  KnowledgeEvaluationCandidate: 'REVIEW',
  DailyReportCaptured: 'AUTO',
  KnowledgeCandidateDetected: 'REVIEW',
  ContentCandidateDetected: 'REVIEW',
  EngineeringCandidateDetected: 'REVIEW',
}

export function getEnabledCoreAgents(): readonly CoreAgentDefinition[] {
  return CORE_AGENTS.filter((agent) => agent.enabled)
}

export function getCoreAgentsForEvent(eventType: WorkEventType): readonly CoreAgentDefinition[] {
  return getEnabledCoreAgents().filter((agent) => agent.acceptedEvents.includes(eventType))
}

export function getSharedCapabilityById(id: SharedCapabilityId): SharedCapabilityDefinition {
  const capability = SHARED_CAPABILITIES.find((item) => item.id === id)
  if (!capability) {
    throw new Error(`Unknown shared capability: ${id}`)
  }
  return capability
}

export function getCoreAgentById(id: CoreAgentId): CoreAgentDefinition {
  const agent = CORE_AGENTS.find((item) => item.id === id)
  if (!agent) {
    throw new Error(`Unknown core agent: ${id}`)
  }
  return agent
}

export function buildWorkGraphRoutingPreview(eventType: WorkEventType): WorkGraphRoutingPreview {
  const targetAgentIds = getCoreAgentsForEvent(eventType).map((agent) => agent.id)
  const downstreamCapabilityIds = targetAgentIds.flatMap((agentId) =>
    getCoreAgentById(agentId).downstream.filter((id): id is SharedCapabilityId =>
      SHARED_CAPABILITIES.some((capability) => capability.id === id),
    ),
  )
  const sharedCapabilityIds = Array.from(new Set<SharedCapabilityId>([
    'evidence-resolver',
    'approval-policy',
    'run-history',
    ...downstreamCapabilityIds,
  ]))

  return {
    eventType,
    targetAgentIds,
    sharedCapabilityIds,
    approvalLevel: EVENT_APPROVAL_LEVELS[eventType],
    duplicatesSourceData: false,
    sourceRefPolicy: 'route by sourceRefs; do not duplicate canonical Airtable / Drive / Notion / GitHub data',
  }
}
