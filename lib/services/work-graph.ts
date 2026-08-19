import {
  buildWorkGraphRoutingPreview,
  getCoreAgentsForEvent,
} from '@/lib/services/agent-registry'
import {
  enqueueApprovalQueueCandidates,
  type ApprovalQueueCandidate,
} from '@/lib/services/approval-queue'
import type { AirtableDecisionCoreValues } from '@/lib/repositories/airtable-decisions'
import type { DecisionCoreFieldKey } from '@/lib/types/decision'
import type {
  ApprovalLevel,
  CandidateWorkGraphEvent,
  CoreAgentDefinition,
  CoreAgentId,
  DecisionCapturedEvent,
  EvidenceRef,
  ApprovalReversibility,
  ApprovalRisk,
  WorkEventType,
  WorkGraphAgentRunResult,
  WorkGraphDispatchResult,
  WorkGraphEvent,
} from '@/lib/types/ai-operations'

type DispatchDecisionCapturedInput = {
  decisionRecordId: string | null
  title: string
  values: AirtableDecisionCoreValues
  occurredAt?: Date
}

type WorkGraphHandlerResult = Omit<WorkGraphAgentRunResult, 'producedQueueItemIds'> & {
  candidates: readonly ApprovalQueueCandidate[]
}

type QueueCandidateEventType = Exclude<WorkEventType, 'DecisionCaptured' | 'DailyReportCaptured'>

type QueueCandidateEvent = CandidateWorkGraphEvent & {
  type: QueueCandidateEventType
}

const DECISION_CORE_KEYS: readonly DecisionCoreFieldKey[] = [
  'consultationConcern',
  'customerTruth',
  'chosenDecision',
  'notChosen',
  'nextObservation',
]

const CANDIDATE_QUEUE_TYPE_BY_EVENT: Record<
  QueueCandidateEventType,
  ApprovalQueueCandidate['type']
> = {
  KnowledgeCandidateDetected: 'knowledge_candidate',
  ContentCandidateDetected: 'content_draft_candidate',
  EngineeringCandidateDetected: 'engineering_candidate',
}

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function buildEventId(type: WorkEventType, key: string): string {
  return `event_${type}_${stableHash(`${type}:${key}`)}`
}

function buildDecisionFieldState(values: AirtableDecisionCoreValues): DecisionCapturedEvent['payload']['fieldState'] {
  return DECISION_CORE_KEYS.reduce((state, key) => {
    state[key] = values[key] ? 'known' : 'unknown'
    return state
  }, {} as DecisionCapturedEvent['payload']['fieldState'])
}

function getEventSourceRef(event: WorkGraphEvent): EvidenceRef | null {
  return event.sourceRefs[0] ?? null
}

function getEventApprovalLevel(event: WorkGraphEvent): ApprovalLevel {
  return buildWorkGraphRoutingPreview(event.type).approvalLevel
}

function getSharedCapabilityIds(event: WorkGraphEvent): WorkGraphDispatchResult['sharedCapabilityIds'] {
  return buildWorkGraphRoutingPreview(event.type).sharedCapabilityIds
}

function buildFailedDispatchResult(event: WorkGraphEvent): WorkGraphDispatchResult {
  return {
    ok: false,
    event,
    routedAgentIds: [],
    sharedCapabilityIds: [],
    agentRuns: [],
    approvalQueueItems: [],
    autoWorkCount: 0,
    error: 'dispatch_failed',
  }
}

function buildAutoRun(agent: CoreAgentDefinition, event: WorkGraphEvent, note: string): WorkGraphHandlerResult {
  return {
    agentId: agent.id,
    eventType: event.type,
    status: 'SUCCESS',
    approvalLevel: getEventApprovalLevel(event),
    sharedCapabilityIds: getSharedCapabilityIds(event),
    note,
    candidates: [],
  }
}

function buildSkippedRun(agent: CoreAgentDefinition, event: WorkGraphEvent, note: string): WorkGraphHandlerResult {
  return {
    agentId: agent.id,
    eventType: event.type,
    status: 'SKIPPED',
    approvalLevel: getEventApprovalLevel(event),
    sharedCapabilityIds: getSharedCapabilityIds(event),
    note,
    candidates: [],
  }
}

function isQueueCandidateEvent(event: WorkGraphEvent): event is QueueCandidateEvent {
  return (
    event.type === 'KnowledgeCandidateDetected'
    || event.type === 'ContentCandidateDetected'
    || event.type === 'EngineeringCandidateDetected'
  )
}

function getCandidateApprovalLevel(event: CandidateWorkGraphEvent): Extract<ApprovalLevel, 'REVIEW' | 'APPROVAL'> {
  if (event.type === 'KnowledgeCandidateDetected') return 'REVIEW'
  if (event.type === 'ContentCandidateDetected') return 'REVIEW'
  return 'REVIEW'
}

function getCandidateRisk(event: QueueCandidateEvent): ApprovalRisk {
  return event.payload.risk ?? (event.type === 'EngineeringCandidateDetected' ? 'MEDIUM' : 'LOW')
}

function getCandidateReversibility(event: QueueCandidateEvent): ApprovalReversibility {
  return event.payload.reversibility ?? (event.type === 'EngineeringCandidateDetected' ? 'PARTIAL' : 'REVERSIBLE')
}

function buildCandidateRun(agent: CoreAgentDefinition, event: QueueCandidateEvent): WorkGraphHandlerResult {
  const evidenceRefs = event.payload.evidenceRefs?.length ? event.payload.evidenceRefs : event.sourceRefs
  const sourceRef = getEventSourceRef(event)

  if (event.type === 'KnowledgeCandidateDetected' && evidenceRefs.length < 2) {
    return buildSkippedRun(
      agent,
      event,
      'Knowledge candidate requires multiple supporting or contrasting source references.',
    )
  }

  const proposedAction = event.payload.proposedAction?.trim()
  if (!proposedAction) {
    return buildSkippedRun(agent, event, 'No proposed action was supplied, so no human decision is needed yet.')
  }

  const candidate: ApprovalQueueCandidate = {
    idempotencyKey: sourceRef?.id ?? event.id,
    type: CANDIDATE_QUEUE_TYPE_BY_EVENT[event.type],
    title: event.payload.title ?? event.type,
    summary: event.payload.summary ?? 'A candidate was routed through the Work Graph.',
    reasonForHuman: event.payload.reasonForHuman
      ?? 'Ikeda judgment can materially change the next action.',
    evidenceRefs,
    proposedAction,
    approvalLevel: getCandidateApprovalLevel(event),
    risk: getCandidateRisk(event),
    reversibility: getCandidateReversibility(event),
    expiresAt: event.payload.expiresAt ?? null,
    sourceAgent: agent.id,
    sourceEvent: {
      id: event.id,
      type: event.type,
    },
    materialHumanDecision: true,
  }

  return {
    agentId: agent.id,
    eventType: event.type,
    status: 'SUCCESS',
    approvalLevel: candidate.approvalLevel,
    sharedCapabilityIds: getSharedCapabilityIds(event),
    note: 'Candidate requires REVIEW and is eligible for Approval Queue.',
    candidates: [candidate],
  }
}

function runCoreAgentForEvent(agent: CoreAgentDefinition, event: WorkGraphEvent): WorkGraphHandlerResult {
  if (event.type === 'DecisionCaptured') {
    return buildAutoRun(
      agent,
      event,
      'DecisionCaptured is routed as source references and field-state metadata only; no queue item is created.',
    )
  }

  if (event.type === 'DailyReportCaptured') {
    return buildAutoRun(agent, event, 'Daily report aggregation is AUTO and bypasses Approval Queue.')
  }

  if (event.type === 'KnowledgeCandidateDetected' && agent.id !== 'decision-learning-intelligence') {
    return buildSkippedRun(agent, event, 'Knowledge candidates are handled by Decision & Learning Intelligence.')
  }

  if (
    (event.type === 'ContentCandidateDetected' || event.type === 'EngineeringCandidateDetected')
    && agent.id !== 'content-product-intelligence'
  ) {
    return buildSkippedRun(agent, event, 'Content and engineering candidates are handled by Content & Product Intelligence.')
  }

  if (!isQueueCandidateEvent(event)) {
    return buildSkippedRun(agent, event, 'No queue candidate handler is available for this event.')
  }

  return buildCandidateRun(agent, event)
}

function attachProducedQueueItemIds(
  run: WorkGraphHandlerResult,
  eventId: string,
  visibleItems: readonly { id: string; sourceAgent: CoreAgentId; sourceEvent: { id: string } }[],
): WorkGraphAgentRunResult {
  return {
    agentId: run.agentId,
    eventType: run.eventType,
    status: run.status,
    approvalLevel: run.approvalLevel,
    sharedCapabilityIds: run.sharedCapabilityIds,
    producedQueueItemIds: visibleItems
      .filter((item) => item.sourceAgent === run.agentId && item.sourceEvent.id === eventId)
      .map((item) => item.id),
    note: run.note,
  }
}

export function buildDecisionCapturedEvent(input: DispatchDecisionCapturedInput): DecisionCapturedEvent {
  const occurredAt = input.occurredAt ?? new Date()
  const recordKey = input.decisionRecordId ?? `${input.title}:${occurredAt.toISOString()}`
  const sourceRef: EvidenceRef = {
    id: `airtable_decision_${stableHash(recordKey)}`,
    source: 'airtable',
    label: 'Airtable Decision',
    recordId: input.decisionRecordId,
    observedAt: occurredAt.toISOString(),
  }

  return {
    id: buildEventId('DecisionCaptured', recordKey),
    type: 'DecisionCaptured',
    occurredAt: occurredAt.toISOString(),
    source: 'airtable',
    sourceRefs: [sourceRef],
    payload: {
      decisionRecordId: input.decisionRecordId,
      title: input.title,
      fieldState: buildDecisionFieldState(input.values),
      containsProfessionalHypothesis: false,
    },
  }
}

export async function dispatchWorkGraphEvent(event: WorkGraphEvent): Promise<WorkGraphDispatchResult> {
  try {
    const targetAgents = getCoreAgentsForEvent(event.type)
    const handlerRuns = targetAgents.map((agent) => runCoreAgentForEvent(agent, event))
    const visibleItems = enqueueApprovalQueueCandidates(handlerRuns.flatMap((run) => run.candidates))
    const agentRuns = handlerRuns.map((run) => attachProducedQueueItemIds(run, event.id, visibleItems))

    return {
      ok: true,
      event,
      routedAgentIds: targetAgents.map((agent) => agent.id),
      sharedCapabilityIds: getSharedCapabilityIds(event),
      agentRuns,
      approvalQueueItems: visibleItems,
      autoWorkCount: agentRuns.filter((run) => run.approvalLevel === 'AUTO' && run.status === 'SUCCESS').length,
      error: null,
    }
  } catch {
    return buildFailedDispatchResult(event)
  }
}

export async function safeDispatchDecisionCaptured(
  input: DispatchDecisionCapturedInput,
  dispatch = dispatchWorkGraphEvent,
): Promise<WorkGraphDispatchResult> {
  const event = buildDecisionCapturedEvent(input)

  try {
    return await dispatch(event)
  } catch {
    return buildFailedDispatchResult(event)
  }
}
