import {
  buildWorkGraphRoutingPreview,
  getCoreAgentsForEvent,
} from '@/lib/services/agent-registry'
import type { AirtableDecisionCoreValues } from '@/lib/repositories/airtable-decisions'
import type { DecisionCaptureSource, DecisionCoreFieldKey } from '@/lib/types/decision'
import type {
  CoreAgentDefinition,
  DecisionCapturedEvent,
  EvidenceRef,
  NextObservationCreatedEvent,
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
  captureSource?: DecisionCaptureSource
  additionalSourceRefs?: readonly EvidenceRef[]
}

type DispatchNextObservationInput = {
  decisionId: string
  observedAt?: Date
}

const DECISION_CORE_KEYS: readonly DecisionCoreFieldKey[] = [
  'consultationConcern',
  'customerTruth',
  'chosenDecision',
  'notChosen',
  'nextObservation',
]

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

function buildAutoRun(agent: CoreAgentDefinition, event: WorkGraphEvent): WorkGraphAgentRunResult {
  const routing = buildWorkGraphRoutingPreview(event.type)

  return {
    agentId: agent.id,
    eventType: event.type,
    status: 'SUCCESS',
    approvalLevel: routing.approvalLevel,
    sharedCapabilityIds: routing.sharedCapabilityIds,
    producedQueueItemIds: [],
    note: `${event.type} is recorded as AUTO metadata only; no Approval Queue item is created.`,
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
    sourceRefs: [sourceRef, ...(input.additionalSourceRefs ?? [])],
    payload: {
      decisionRecordId: input.decisionRecordId,
      title: input.title,
      fieldState: buildDecisionFieldState(input.values),
      containsProfessionalHypothesis: false,
      captureSource: input.captureSource,
    },
  }
}

function buildNextObservationCreatedEvent(input: DispatchNextObservationInput): NextObservationCreatedEvent {
  const observedAt = input.observedAt ?? new Date()
  const sourceRef: EvidenceRef = {
    id: `airtable_decision_${stableHash(input.decisionId)}`,
    source: 'airtable',
    label: 'Airtable Decision',
    recordId: input.decisionId,
    observedAt: observedAt.toISOString(),
  }

  return {
    id: buildEventId('NextObservationCreated', input.decisionId),
    type: 'NextObservationCreated',
    occurredAt: observedAt.toISOString(),
    source: 'airtable',
    sourceRefs: [sourceRef],
    payload: {
      decisionId: input.decisionId,
    },
  }
}

export async function dispatchWorkGraphEvent(event: WorkGraphEvent): Promise<WorkGraphDispatchResult> {
  try {
    const routing = buildWorkGraphRoutingPreview(event.type)
    const targetAgents = getCoreAgentsForEvent(event.type)
    const agentRuns = targetAgents.map((agent) => buildAutoRun(agent, event))

    return {
      ok: true,
      event,
      routedAgentIds: routing.targetAgentIds,
      sharedCapabilityIds: routing.sharedCapabilityIds,
      agentRuns,
      approvalQueueItems: [],
      autoWorkCount: agentRuns.filter((run) => run.status === 'SUCCESS').length,
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

export async function safeDispatchNextObservationCreated(
  input: DispatchNextObservationInput,
  dispatch = dispatchWorkGraphEvent,
): Promise<WorkGraphDispatchResult> {
  const event = buildNextObservationCreatedEvent(input)

  try {
    return await dispatch(event)
  } catch {
    return buildFailedDispatchResult(event)
  }
}
