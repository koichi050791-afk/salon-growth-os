import assert from 'node:assert/strict'
import { shouldCreateApprovalQueueItem } from '@/lib/services/approval-queue'
import {
  buildAutonomousOperationsProjection,
  type BuildAutonomousOperationsInput,
} from '@/lib/services/autonomous-operations'
import { evaluateAutonomyPolicy } from '@/lib/services/autonomy-policy'
import { buildRevenueIntelligenceProjection } from '@/lib/services/revenue-intelligence'
import { safeDispatchDecisionCaptured } from '@/lib/services/work-graph'
import type { ListAirtableDecisionsResult } from '@/lib/repositories/airtable-decisions'
import type { ListCustomerGrowthResult } from '@/lib/repositories/airtable-customer-growth'
import type { ContentRegistryReadResult } from '@/lib/types/content-source'

const sourceRef = {
  id: 'synthetic_source',
  source: 'internal',
  label: 'Synthetic source',
} as const

const decisionValues = {
  consultationConcern: null,
  customerTruth: null,
  chosenDecision: null,
  notChosen: null,
  nextObservation: null,
}

function decisions(data: ListAirtableDecisionsResult['data']): ListAirtableDecisionsResult {
  return { data, error: null }
}

function customerGrowth(data: ListCustomerGrowthResult['data']): ListCustomerGrowthResult {
  return { data, error: null }
}

function contentRegistry(input?: Partial<ContentRegistryReadResult>): ContentRegistryReadResult {
  return {
    data: input?.data ?? [],
    error: input?.error ?? null,
    source: {
      provider: 'GOOGLE_SHEETS',
      spreadsheetId: 'synthetic_sheet',
      sheetName: 'synthetic_registry',
    },
  }
}

function projectionInput(input: {
  decisions?: ListAirtableDecisionsResult
  customerGrowth?: ListCustomerGrowthResult
  contentRegistry?: ContentRegistryReadResult
}): BuildAutonomousOperationsInput {
  const content = input.contentRegistry ?? contentRegistry()
  const decisionResult = input.decisions ?? decisions([])
  const customerResult = input.customerGrowth ?? customerGrowth([])

  return {
    contentRegistry: content,
    decisions: decisionResult,
    customerGrowth: customerResult,
    revenue: buildRevenueIntelligenceProjection({
      contentRegistry: content,
      decisions: decisionResult,
      customerGrowth: customerResult,
    }),
    now: new Date('2026-08-21T00:00:00.000Z'),
  }
}

async function main() {
  const unknownDecision = {
    id: 'rec_unknown_decision',
    title: 'Synthetic Decision',
    status: 'recorded',
    customerId: null,
    visitId: null,
    createdAt: '2026-08-21T00:00:00.000Z',
    values: {
      ...decisionValues,
      consultationConcern: 'shorter and lighter',
      nextObservation: 'check shape at next visit',
    },
    outcome: null,
    validation: null,
  }
  const sampleDecision = {
    ...unknownDecision,
    id: 'rec_sample_decision',
    values: {
      ...unknownDecision.values,
      consultationConcern: '【SAMPLE】sample consultation',
    },
  }
  const testDecision = {
    ...unknownDecision,
    id: 'rec_test_decision',
    values: {
      ...unknownDecision.values,
      consultationConcern: '【TEST】test consultation',
    },
  }
  const realBookedCustomer = {
    id: 'rec_real_customer',
    name: 'Synthetic Customer',
    customerId: 'C-SYN-REAL',
    state: 'CORE',
    expectedCycleDays: 45,
    lastVisitDate: '2026-08-20',
    expectedReturnDate: '2026-10-04',
    nextPlanStatus: 'BOOKED',
    dataKind: 'real',
  } as const
  const sampleBookedCustomer = {
    ...realBookedCustomer,
    id: 'rec_sample_customer',
    customerId: 'C-SYN-SAMPLE',
    dataKind: 'sample',
  }
  const unknownBookedCustomer = {
    ...realBookedCustomer,
    id: 'rec_unknown_customer',
    customerId: 'C-SYN-UNKNOWN',
    dataKind: null,
  }

  const unknownRevenue = buildRevenueIntelligenceProjection({
    contentRegistry: contentRegistry(),
    decisions: decisions([unknownDecision]),
    customerGrowth: customerGrowth([]),
  })
  assert.equal(unknownRevenue.realSignalCount, 0)
  assert.equal(unknownRevenue.unknownExcludedCount, 1)

  const excludedRevenue = buildRevenueIntelligenceProjection({
    contentRegistry: contentRegistry(),
    decisions: decisions([sampleDecision, testDecision]),
    customerGrowth: customerGrowth([sampleBookedCustomer, unknownBookedCustomer]),
  })
  assert.equal(excludedRevenue.realSignalCount, 0)
  assert.equal(excludedRevenue.sampleExcludedCount, 2)
  assert.equal(excludedRevenue.testExcludedCount, 1)
  assert.equal(excludedRevenue.unknownExcludedCount, 1)

  const bookingRevenue = buildRevenueIntelligenceProjection({
    contentRegistry: contentRegistry(),
    decisions: decisions([]),
    customerGrowth: customerGrowth([realBookedCustomer]),
  })
  assert.equal(bookingRevenue.realSignalCount, 1)
  assert.equal(bookingRevenue.signals[0]?.signalType, 'BOOKING')

  const noActionPolicy = evaluateAutonomyPolicy({ actionKind: 'inspect', materialHumanDecision: false })
  assert.equal(noActionPolicy.executionLevel, 'AUTO')
  assert.equal(noActionPolicy.requiresApprovalQueueItem, false)

  assert.equal(shouldCreateApprovalQueueItem({
    idempotencyKey: 'auto-no-action',
    type: 'engineering_candidate',
    title: 'Synthetic auto result',
    summary: 'Synthetic auto result',
    reasonForHuman: 'No human decision required.',
    evidenceRefs: [sourceRef],
    proposedAction: 'No action.',
    approvalLevel: 'AUTO',
    risk: 'LOW',
    reversibility: 'REVERSIBLE',
    sourceAgent: 'content-product-intelligence',
    sourceEvent: { id: 'event_auto', type: 'EngineeringCandidateDetected' },
    materialHumanDecision: false,
  }), false)

  assert.equal(shouldCreateApprovalQueueItem({
    idempotencyKey: 'review-candidate',
    type: 'engineering_candidate',
    title: 'Synthetic review result',
    summary: 'Synthetic review result',
    reasonForHuman: 'Human review can change the next action.',
    evidenceRefs: [sourceRef],
    proposedAction: 'Review the candidate.',
    approvalLevel: 'REVIEW',
    risk: 'LOW',
    reversibility: 'REVERSIBLE',
    sourceAgent: 'content-product-intelligence',
    sourceEvent: { id: 'event_review', type: 'EngineeringCandidateDetected' },
    materialHumanDecision: true,
  }), true)

  const approvalPolicy = evaluateAutonomyPolicy({
    actionKind: 'merge_main',
    requestedLevel: 'AUTO',
    materialHumanDecision: true,
  })
  assert.equal(approvalPolicy.executionLevel, 'APPROVAL')
  assert.equal(approvalPolicy.canAutoExecute, false)

  const unavailableProjection = buildAutonomousOperationsProjection(projectionInput({
    contentRegistry: contentRegistry({ error: 'read_failed' }),
  }))
  assert.ok(unavailableProjection.dataQuality.findings.some((finding) =>
    finding.status === 'UNAVAILABLE' && finding.title === 'Content Registry source unavailable',
  ))

  const loopProjection = buildAutonomousOperationsProjection(projectionInput({
    decisions: decisions([unknownDecision]),
  }))
  const openLoopFinding = loopProjection.dataQuality.findings.find((finding) =>
    finding.title === 'Next Observation exists without Validation',
  )
  assert.equal(openLoopFinding?.status, 'UNKNOWN')
  assert.equal(openLoopFinding?.patrolOutcome, 'REVIEW_CANDIDATE')

  const dispatchResult = await safeDispatchDecisionCaptured(
    {
      decisionRecordId: 'rec_saved_decision',
      title: 'Synthetic saved Decision',
      values: decisionValues,
    },
    async () => {
      throw new Error('synthetic downstream failure')
    },
  )
  assert.equal(dispatchResult.ok, false)
  assert.equal(dispatchResult.event.type, 'DecisionCaptured')
  assert.equal(dispatchResult.event.payload.decisionRecordId, 'rec_saved_decision')

  console.log('Autonomous Operations checks passed')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
