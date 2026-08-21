import type {
  ApprovalLevel,
  CoreAgentDefinition,
  CoreAgentId,
  SharedCapabilityId,
  WorkEventType,
  WorkGraphRoutingPreview,
} from '@/lib/types/ai-operations'

export const CORE_AGENTS: readonly CoreAgentDefinition[] = [
  {
    id: 'salon-customer-intelligence',
    displayName: 'Salon & Customer Intelligence',
    acceptedEvents: ['DecisionCaptured', 'NextObservationCreated'],
    enabled: true,
  },
  {
    id: 'decision-learning-intelligence',
    displayName: 'Decision & Learning Intelligence',
    acceptedEvents: ['DecisionCaptured', 'NextObservationCreated'],
    enabled: true,
  },
  {
    id: 'growth-market-intelligence',
    displayName: 'Growth & Market Intelligence',
    acceptedEvents: ['DecisionCaptured'],
    enabled: true,
  },
  {
    id: 'content-product-intelligence',
    displayName: 'Content & Product Intelligence',
    acceptedEvents: ['DecisionCaptured'],
    enabled: true,
  },
]

const SHARED_CAPABILITY_IDS: readonly SharedCapabilityId[] = [
  'evidence-resolver',
  'approval-policy',
  'run-history',
]

const EVENT_APPROVAL_LEVELS: Record<WorkEventType, ApprovalLevel> = {
  DecisionCaptured: 'AUTO',
  NextObservationCreated: 'AUTO',
}

export function getCoreAgentsForEvent(eventType: WorkEventType): readonly CoreAgentDefinition[] {
  return CORE_AGENTS.filter((agent) => agent.enabled && agent.acceptedEvents.includes(eventType))
}

export function buildWorkGraphRoutingPreview(eventType: WorkEventType): WorkGraphRoutingPreview {
  const targetAgentIds = getCoreAgentsForEvent(eventType).map((agent) => agent.id as CoreAgentId)

  return {
    eventType,
    targetAgentIds,
    sharedCapabilityIds: SHARED_CAPABILITY_IDS,
    approvalLevel: EVENT_APPROVAL_LEVELS[eventType],
    duplicatesSourceData: false,
    sourceRefPolicy: 'route by sourceRefs; do not duplicate canonical Airtable data',
  }
}
