import assert from 'node:assert/strict'
import { saveDecisionCapture } from '@/lib/services/decision-capture-save'
import { shouldShowDecisionInHistory } from '@/lib/services/decision-history-visibility'
import {
  classifyKnowledgeDecisionEvidence,
  evaluateKnowledgeCandidate,
  projectAirtableDecisionToKnowledgeCase,
} from '@/lib/services/knowledge-candidate'
import {
  isOperationalCustomer,
  type CustomerGrowthRecord,
} from '@/lib/repositories/airtable-customer-growth'
import type {
  AirtableDecisionRecord,
  CreateAirtableDecisionInput,
} from '@/lib/repositories/airtable-decisions'
import type { WorkGraphDispatchResult, WorkGraphEvent } from '@/lib/types/ai-operations'
import type {
  KnowledgeCaseValidationState,
  KnowledgeDecisionCase,
} from '@/lib/types/knowledge-candidate'
import { normalizeDataKind, type DataKind } from '@/lib/types/data-kind'

const now = new Date('2026-08-21T02:30:00.000Z')

function caseInput(input: {
  decisionId: string
  dataKind: DataKind
  consultationConcern?: string
  customerTruth?: string
  chosenDecision?: string
  notChosen?: string
  nextObservation?: string
  outcome?: string | null
  validation?: KnowledgeCaseValidationState | null
}): KnowledgeDecisionCase {
  return {
    decisionId: input.decisionId,
    dataKind: input.dataKind,
    values: {
      consultationConcern: input.consultationConcern ?? 'hair feels wide and heavy',
      customerTruth: input.customerTruth ?? 'dense ends and morning handling concern confirmed',
      chosenDecision: input.chosenDecision ?? 'preserve perimeter and adjust interior weight only',
      notChosen: input.notChosen ?? 'full heavy thinning',
      nextObservation: input.nextObservation ?? 'check morning handling at next visit',
    },
    outcome: input.outcome ?? null,
    validation: input.validation ?? 'UNOBSERVED',
  }
}

function dispatchResult(event: WorkGraphEvent, ok = true): WorkGraphDispatchResult {
  return {
    ok,
    event,
    routedAgentIds: [],
    sharedCapabilityIds: [],
    agentRuns: [],
    approvalQueueItems: [],
    autoWorkCount: 0,
    error: ok ? null : 'dispatch_failed',
  }
}

function decisionEvent(): WorkGraphEvent {
  return {
    id: 'event_decision',
    type: 'DecisionCaptured',
    occurredAt: now.toISOString(),
    source: 'airtable',
    sourceRefs: [],
    payload: {
      decisionRecordId: 'rec_saved',
      title: 'Synthetic',
      fieldState: {
        consultationConcern: 'known',
        customerTruth: 'known',
        chosenDecision: 'known',
        notChosen: 'known',
        nextObservation: 'known',
      },
      containsProfessionalHypothesis: false,
      captureSource: 'API',
      dataKind: 'UNKNOWN',
    },
  }
}

function decisionRecord(input: {
  id: string
  dataKind: DataKind
  consultationConcern?: string | null
}): AirtableDecisionRecord {
  return {
    id: input.id,
    title: 'Synthetic Decision',
    status: '記録済み',
    dataKind: input.dataKind,
    values: {
      consultationConcern: input.consultationConcern ?? 'synthetic concern',
      customerTruth: 'synthetic confirmed facts',
      chosenDecision: 'synthetic decision',
      notChosen: 'synthetic not chosen',
      nextObservation: 'synthetic next observation',
    },
  }
}

function customerRecord(dataKind: string | null): CustomerGrowthRecord {
  return {
    id: 'customer_growth_synthetic',
    name: 'Synthetic Customer',
    customerId: 'SYNTHETIC',
    state: null,
    expectedCycleDays: null,
    lastVisitDate: null,
    expectedReturnDate: null,
    nextPlanStatus: null,
    dataKind,
  }
}

async function main() {
  const target = caseInput({ decisionId: 'real_decision_1', dataKind: 'REAL' })
  const similar = caseInput({ decisionId: 'real_decision_2', dataKind: 'REAL' })
  const unrelated = caseInput({
    decisionId: 'real_decision_unrelated',
    dataKind: 'REAL',
    consultationConcern: 'wants a brighter color',
    customerTruth: 'previous color history confirmed',
    chosenDecision: 'use a soft highlight plan',
    notChosen: 'single process dark color',
  })

  assert.equal(classifyKnowledgeDecisionEvidence({
    title: '2026 Decision',
    values: target.values,
  }), 'UNKNOWN')
  assert.equal(normalizeDataKind(undefined), 'UNKNOWN')
  assert.equal(classifyKnowledgeDecisionEvidence({
    dataKind: 'REAL',
    title: '2026 Decision',
    values: target.values,
  }), 'REAL')
  assert.equal(classifyKnowledgeDecisionEvidence({
    dataKind: 'REAL',
    values: { consultationConcern: '【TEST】synthetic check' },
  }), 'TEST')
  assert.equal(classifyKnowledgeDecisionEvidence({
    dataKind: 'REAL',
    sourceKind: 'synthetic',
    values: target.values,
  }), 'TEST')
  assert.equal(classifyKnowledgeDecisionEvidence({
    dataKind: 'SAMPLE',
    values: target.values,
  }), 'SAMPLE')

  const projected = projectAirtableDecisionToKnowledgeCase({
    id: 'rec_airtable_without_real_marker',
    title: '2026-08-21 Decision記録',
    status: '記録済み',
    dataKind: 'UNKNOWN',
    values: {
      consultationConcern: target.values.consultationConcern ?? null,
      customerTruth: target.values.customerTruth ?? null,
      chosenDecision: target.values.chosenDecision ?? null,
      notChosen: target.values.notChosen ?? null,
      nextObservation: target.values.nextObservation ?? null,
    },
  })
  assert.equal(projected.dataKind, 'UNKNOWN')

  assert.equal(shouldShowDecisionInHistory(decisionRecord({
    id: 'history_real',
    dataKind: 'REAL',
  })), true)
  assert.equal(shouldShowDecisionInHistory(decisionRecord({
    id: 'history_unknown',
    dataKind: 'UNKNOWN',
  })), true)
  assert.equal(shouldShowDecisionInHistory(decisionRecord({
    id: 'history_sample',
    dataKind: 'SAMPLE',
  })), false)
  assert.equal(shouldShowDecisionInHistory(decisionRecord({
    id: 'history_test_kind',
    dataKind: 'TEST',
  })), false)
  assert.equal(shouldShowDecisionInHistory(decisionRecord({
    id: 'history_test_prefix',
    dataKind: 'UNKNOWN',
    consultationConcern: '【TEST】synthetic check',
  })), false)

  assert.equal(isOperationalCustomer(customerRecord(null)), true)
  assert.equal(isOperationalCustomer(customerRecord('UNKNOWN')), true)
  assert.equal(isOperationalCustomer(customerRecord('REAL')), true)
  assert.equal(isOperationalCustomer(customerRecord('TEST')), true)
  assert.equal(isOperationalCustomer(customerRecord('sample')), false)

  ;(['TEST', 'SAMPLE', 'UNKNOWN'] as const).forEach((dataKind) => {
    const result = evaluateKnowledgeCandidate({
      targetDecision: caseInput({ decisionId: `target_${dataKind}`, dataKind }),
      comparisonDecisions: [similar],
      now,
    })
    assert.equal(result.status, 'NO_ACTION')
    assert.equal(result.reason, 'TARGET_NOT_REAL')
  })

  const singleReal = evaluateKnowledgeCandidate({
    targetDecision: target,
    comparisonDecisions: [],
    now,
  })
  assert.equal(singleReal.status, 'NO_ACTION')
  assert.equal(singleReal.reason, 'INSUFFICIENT_REAL_CASES')

  const insufficientSimilarity = evaluateKnowledgeCandidate({
    targetDecision: target,
    comparisonDecisions: [unrelated],
    now,
  })
  assert.equal(insufficientSimilarity.status, 'NO_ACTION')
  assert.equal(insufficientSimilarity.reason, 'INSUFFICIENT_SIMILARITY')

  const unvalidatedCandidate = evaluateKnowledgeCandidate({
    targetDecision: target,
    comparisonDecisions: [similar],
    now,
  })
  assert.equal(unvalidatedCandidate.status, 'CANDIDATE_REVIEW')
  assert.equal(unvalidatedCandidate.candidate.validationStatus, 'UNVALIDATED')
  assert.equal(unvalidatedCandidate.candidate.supportingCount, 2)
  assert.equal(unvalidatedCandidate.candidate.evidenceDecisionIds.includes('real_decision_1'), true)
  assert.equal(unvalidatedCandidate.candidate.statement.includes('可能性'), true)
  assert.equal(unvalidatedCandidate.candidate.statement.includes('未検証'), true)

  const supportedCandidate = evaluateKnowledgeCandidate({
    targetDecision: target,
    comparisonDecisions: [
      caseInput({
        decisionId: 'real_decision_supported_2',
        dataKind: 'REAL',
        outcome: 'morning handling improved',
        validation: 'SUPPORTED',
      }),
      caseInput({ decisionId: 'real_decision_supported_3', dataKind: 'REAL' }),
    ],
    now,
  })
  assert.equal(supportedCandidate.status, 'CANDIDATE_REVIEW')
  assert.equal(supportedCandidate.candidate.validationStatus, 'PARTIALLY_VALIDATED')
  assert.notEqual(supportedCandidate.candidate.validationStatus, 'VALIDATED')

  const counterCandidate = evaluateKnowledgeCandidate({
    targetDecision: target,
    comparisonDecisions: [
      similar,
      caseInput({
        decisionId: 'real_counter_decision',
        dataKind: 'REAL',
        chosenDecision: 'full heavy thinning',
        notChosen: 'preserve perimeter and adjust interior weight only',
        validation: 'CONTRADICTED',
      }),
    ],
    now,
  })
  assert.equal(counterCandidate.status, 'CANDIDATE_REVIEW')
  assert.equal(counterCandidate.candidate.counterEvidenceDecisionIds.includes('real_counter_decision'), true)
  assert.equal(counterCandidate.candidate.confidence, 'LOW')

  const piiSafeCandidate = evaluateKnowledgeCandidate({
    targetDecision: caseInput({
      decisionId: 'real_pii_guard_1',
      dataKind: 'REAL',
      chosenDecision: 'adjust interior weight only',
      customerTruth: 'private-contact-marker was mentioned in synthetic input',
    }),
    comparisonDecisions: [
      caseInput({
        decisionId: 'real_pii_guard_2',
        dataKind: 'REAL',
        chosenDecision: 'adjust interior weight only',
        customerTruth: 'private-contact-marker was mentioned in synthetic input',
      }),
    ],
    now,
  })
  assert.equal(piiSafeCandidate.status, 'CANDIDATE_REVIEW')
  const serializedPiiSafeCandidate = JSON.stringify(piiSafeCandidate.candidate)
  assert.equal(serializedPiiSafeCandidate.includes('private-contact-marker'), false)

  const createdInputs: CreateAirtableDecisionInput[] = []
  const failedDownstream = await saveDecisionCapture({
    source: 'API',
    fields: {
      consultationConcern: 'synthetic downstream check',
      customerTruth: 'confirmed facts only',
      chosenDecision: 'small reversible decision',
      notChosen: 'large irreversible decision',
      nextObservation: 'check next time',
    },
    now,
  }, {
    createDecisionRecord: async (input) => {
      createdInputs.push(input)
      return { ok: true, error: null, recordId: 'rec_saved_even_when_dispatch_fails' }
    },
    dispatchDecisionCaptured: async () => dispatchResult(decisionEvent(), false),
    dispatchNextObservationCreated: async () => dispatchResult(decisionEvent(), false),
  })
  assert.equal(failedDownstream.ok, true)
  assert.equal(failedDownstream.saved, true)
  assert.equal(createdInputs.length, 1)
  assert.equal(failedDownstream.warnings.some((warning) =>
    warning.code === 'DOWNSTREAM_DISPATCH_FAILED',
  ), true)

  console.log('Knowledge candidate foundation checks passed')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
