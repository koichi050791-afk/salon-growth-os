import type { AirtableDecisionCoreValues } from '@/lib/repositories/airtable-decisions'
import {
  buildKnowledgeCandidateEvent,
  detectKnowledgeProposals,
  type KnowledgeProposal,
} from '@/lib/services/knowledge-intelligence'
import {
  buildDecisionCapturedEvent,
  dispatchWorkGraphEvent,
} from '@/lib/services/work-graph'
import type { WorkGraphDispatchResult } from '@/lib/types/ai-operations'

type RunDecisionIntelligencePipelineInput = {
  decisionRecordId: string | null
  title: string
  values: AirtableDecisionCoreValues
  occurredAt?: Date
}

export type DecisionIntelligencePipelineResult = {
  decisionDispatch: WorkGraphDispatchResult
  knowledgeProposals: readonly KnowledgeProposal[]
  knowledgeDispatches: readonly WorkGraphDispatchResult[]
}

export async function runDecisionIntelligencePipeline(
  input: RunDecisionIntelligencePipelineInput,
): Promise<DecisionIntelligencePipelineResult> {
  const occurredAt = input.occurredAt ?? new Date()
  const decisionEvent = buildDecisionCapturedEvent({ ...input, occurredAt })
  const decisionDispatch = await dispatchWorkGraphEvent(decisionEvent)

  if (!decisionDispatch.ok) {
    return {
      decisionDispatch,
      knowledgeProposals: [],
      knowledgeDispatches: [],
    }
  }

  const sourceRef = decisionEvent.sourceRefs[0]
  if (!sourceRef) {
    return {
      decisionDispatch,
      knowledgeProposals: [],
      knowledgeDispatches: [],
    }
  }

  try {
    const knowledgeProposals = detectKnowledgeProposals({
      decisionRecordId: input.decisionRecordId,
      decisionTitle: input.title,
      values: input.values,
      sourceRef,
      occurredAt,
    })

    const knowledgeDispatches: WorkGraphDispatchResult[] = []
    for (const proposal of knowledgeProposals) {
      const event = buildKnowledgeCandidateEvent(proposal, occurredAt)
      knowledgeDispatches.push(await dispatchWorkGraphEvent(event))
    }

    return {
      decisionDispatch,
      knowledgeProposals,
      knowledgeDispatches,
    }
  } catch {
    // Decision persistence and base Work Graph dispatch remain successful even
    // when downstream intelligence fails. Intelligence is additive, not transactional.
    return {
      decisionDispatch,
      knowledgeProposals: [],
      knowledgeDispatches: [],
    }
  }
}
