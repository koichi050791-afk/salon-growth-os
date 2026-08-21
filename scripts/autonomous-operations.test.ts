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
  const healthyCoverageProjection = buildAutonomousOperationsProjection(projectionInput({}))
  const runHistoryFact = healthyCoverageProjection.health.observedFacts.find((fact) =>
    fact.id === 'run_history_persistence',
  )
  const approvalPersistenceFact = healthyCoverageProjection.health.observedFacts.find((fact) =>
    fact.id === 'approval_queue_persistence',
  )
  const ciFact = healthyCoverageProjection.engineeringTriage.observedFacts.find((fact) =>
    fact.id === 'ci_status',
  )
  const knowledgePatrol = healthyCoverageProjection.patrolResults.find((result) =>
    result.domain === 'KNOWLEDGE',
  )
  assert.equal(runHistoryFact?.status, 'UNAVAILABLE')
  assert.equal(approvalPersistenceFact?.status, 'UNAVAILABLE')
  assert.equal(ciFact?.status, 'NOT_CHECKED')
  assert.equal(knowledgePatrol?.status, 'UNAVAILABLE')
  assert.equal(knowledgePatrol?.outcome, 'NO_ACTION')
  assert.equal(healthyCoverageProjection.health.status, 'PASS')
  assert.equal(healthyCoverageProjection.health.findings.length, 0)

  const realZeroFact = healthyCoverageProjection.dataQuality.observedFacts.find((fact) =>
    fact.id === 'decision_evidence_real',
  )
  assert.equal(realZeroFact?.status, 'PASS')
  assert.equal(realZeroFact?.value, '0')

  const noActionPolicy = evaluateAutonomyPolicy({ actionKind: 'inspect', materialHumanDecision: false })
  assert.equal(noActionPolicy.executionLevel, 'AUTO')
  assert.equal(noActionPolicy.requiresApprovalQueueItem, false)
  const nonMaterialReviewPolicy = evaluateAutonomyPolicy({
    actionKind: 'non_destructive_remediation',
    materialHumanDecision: false,
  })
  assert.equal(nonMaterialReviewPolicy.executionLevel, 'REVIEW')
  assert.equal(nonMaterialReviewPolicy.createsReviewCandidate, false)

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
  assert.equal(openLoopFinding?.patrolOutcome, 'NO_ACTION')
  assert.equal(loopProjection.dataQuality.proposedActions.length, 0)
  assert.equal(loopProjection.patrolResults.some((result) => result.outcome === 'REVIEW_CANDIDATE'), false)

  const contentQualityProjection = buildAutonomousOperationsProjection(projectionInput({
    contentRegistry: contentRegistry({
      data: [{
        id: 'LINK-SYNTHETIC',
        title: 'Synthetic content',
        publicUrl: 'https://example.com/synthetic',
        account: 'customer',
        role: null,
        relatedCaseIds: [],
        relatedKnowledgeIds: [],
        canonicalBodySource: null,
        bodySyncStatus: 'BODY_SOURCE_MISSING',
        bodySyncReasons: ['canonical_body_source_missing'],
        monetization: 'UNKNOWN',
        evidenceState: null,
        evidenceRefs: [],
        productizationGate: {
          state: 'HOLD',
          reason: 'synthetic_source_missing',
        },
        updatedAt: null,
      }],
    }),
  }))
  const contentMissingFinding = contentQualityProjection.dataQuality.findings.find((finding) =>
    finding.title === 'Content body source is missing',
  )
  assert.equal(contentMissingFinding?.status, 'FAIL')
  assert.equal(contentMissingFinding?.patrolOutcome, 'NO_ACTION')
  assert.equal(contentQualityProjection.dataQuality.proposedActions.length, 0)
  assert.equal(contentQualityProjection.patrolResults.some((result) =>
    result.outcome === 'REVIEW_CANDIDATE',
  ), false)

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
