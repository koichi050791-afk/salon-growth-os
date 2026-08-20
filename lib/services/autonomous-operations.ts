import type {
  AirtableDecisionRecord,
  ListAirtableDecisionsResult,
} from '@/lib/repositories/airtable-decisions'
import type {
  CustomerGrowthRecord,
  ListCustomerGrowthResult,
} from '@/lib/repositories/airtable-customer-growth'
import { evaluateAutonomyPolicy, shouldSurfaceAutonomousAction } from '@/lib/services/autonomy-policy'
import {
  classifyCustomerEvidence,
  classifyDecisionEvidence,
} from '@/lib/services/revenue-intelligence'
import type {
  AutonomousEvidenceClass,
  AutonomousObservedFact,
  AutonomousOperationFinding,
  AutonomousOperationRun,
  AutonomousOperationStatus,
  AutonomousOperationType,
  AutonomyPolicyDecision,
  CoreAgentId,
  DepartmentPatrolDomain,
  DepartmentPatrolOutcome,
  DepartmentPatrolResult,
  EvidenceRef,
  WeeklyOperationsReview,
} from '@/lib/types/ai-operations'
import type { ContentRegistryReadResult } from '@/lib/types/content-source'
import type {
  RevenueEvidenceClass,
  RevenueIntelligenceProjection,
} from '@/lib/types/revenue-intelligence'

export type EngineeringTriageEvidence = {
  failedCiCount?: number | null
  failedDeploymentCount?: number | null
  openDraftPrCount?: number | null
  unresolvedReviewCommentCount?: number | null
  staleEngineeringCandidateCount?: number | null
  sourceRefs?: readonly EvidenceRef[]
}

export type BuildAutonomousOperationsInput = {
  contentRegistry: ContentRegistryReadResult
  decisions: ListAirtableDecisionsResult
  customerGrowth: ListCustomerGrowthResult
  revenue: RevenueIntelligenceProjection
  engineering?: EngineeringTriageEvidence
  now?: Date
}

export type AutonomousOperationsProjection = {
  health: AutonomousOperationRun
  engineeringTriage: AutonomousOperationRun
  dataQuality: AutonomousOperationRun
  departmentPatrol: AutonomousOperationRun
  weeklyOperationsReview: AutonomousOperationRun
  patrolResults: readonly DepartmentPatrolResult[]
  weeklyReview: WeeklyOperationsReview
  schedulerBoundary: {
    callable: true
    schedulerConfigured: false
    externalTriggerOnly: true
    note: string
  }
}

const SOURCE_REFS = {
  repository: {
    id: 'github_repository_configuration',
    source: 'github',
    label: 'GitHub repository configuration',
  },
  airtableDecision: {
    id: 'airtable_decision_projection',
    source: 'airtable',
    label: 'Airtable Decision projection',
  },
  airtableCustomerGrowth: {
    id: 'airtable_customer_growth_projection',
    source: 'airtable',
    label: 'Airtable Customer Growth projection',
  },
  contentRegistry: {
    id: 'google_sheets_content_registry',
    source: 'drive',
    label: 'Google Sheets Content Registry',
  },
  workGraph: {
    id: 'internal_work_graph',
    source: 'internal',
    label: 'Internal Work Graph',
  },
  approvalQueue: {
    id: 'internal_approval_queue',
    source: 'internal',
    label: 'In-memory Approval Queue',
  },
} as const satisfies Record<string, EvidenceRef>

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function toAutonomousEvidenceClass(value: RevenueEvidenceClass): AutonomousEvidenceClass {
  return value
}

function countEvidenceClasses(
  values: readonly AutonomousEvidenceClass[],
): Record<AutonomousEvidenceClass, number> {
  return {
    REAL: values.filter((value) => value === 'REAL').length,
    SAMPLE: values.filter((value) => value === 'SAMPLE').length,
    TEST: values.filter((value) => value === 'TEST').length,
    UNKNOWN: values.filter((value) => value === 'UNKNOWN').length,
  }
}

function buildObservedFact(input: {
  id: string
  label: string
  value: string | number
  status: AutonomousOperationStatus
  evidenceClass?: AutonomousEvidenceClass
  sourceRefs?: readonly EvidenceRef[]
}): AutonomousObservedFact {
  return {
    id: input.id,
    label: input.label,
    value: String(input.value),
    status: input.status,
    evidenceClass: input.evidenceClass,
    sourceRefs: input.sourceRefs ?? [],
  }
}

function buildFinding(input: {
  id: string
  operationType: AutonomousOperationType
  title: string
  summary: string
  status: AutonomousOperationStatus
  severity?: AutonomousOperationFinding['severity']
  evidenceClass?: AutonomousEvidenceClass
  sourceRefs?: readonly EvidenceRef[]
  reasonForHuman?: string | null
  proposedAction?: string | null
  patrolOutcome?: DepartmentPatrolOutcome
}): AutonomousOperationFinding {
  return {
    id: `${input.operationType.toLowerCase()}_${stableHash(input.id)}`,
    operationType: input.operationType,
    title: input.title,
    summary: input.summary,
    status: input.status,
    severity: input.severity ?? 'LOW',
    evidenceClass: input.evidenceClass ?? 'UNKNOWN',
    sourceRefs: input.sourceRefs ?? [],
    reasonForHuman: input.reasonForHuman ?? null,
    proposedAction: input.proposedAction ?? null,
    patrolOutcome: input.patrolOutcome ?? 'NO_ACTION',
  }
}

function aggregateStatus(
  statuses: readonly AutonomousOperationStatus[],
  fallback: AutonomousOperationStatus,
): AutonomousOperationStatus {
  if (statuses.length === 0) return fallback
  if (statuses.includes('FAIL')) return 'FAIL'
  if (statuses.includes('UNAVAILABLE')) return 'UNAVAILABLE'
  if (statuses.includes('UNKNOWN')) return 'UNKNOWN'
  if (statuses.includes('NOT_CHECKED')) return 'NOT_CHECKED'
  if (statuses.every((status) => status === 'NO_ACTION')) return 'NO_ACTION'
  if (statuses.includes('NO_ACTION')) return 'NO_ACTION'
  return 'PASS'
}

function buildOperationRun(input: {
  operationId: string
  operationType: AutonomousOperationType
  startedAt: string
  completedAt: string
  status: AutonomousOperationStatus
  executionLevel?: AutonomousOperationRun['executionLevel']
  sourceRefs?: readonly EvidenceRef[]
  observedFacts?: readonly AutonomousObservedFact[]
  findings?: readonly AutonomousOperationFinding[]
  proposedActions?: readonly AutonomyPolicyDecision[]
  error?: string | null
  unavailableReason?: string | null
}): AutonomousOperationRun {
  return {
    operationId: input.operationId,
    operationType: input.operationType,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    status: input.status,
    executionLevel: input.executionLevel ?? 'AUTO',
    sourceRefs: input.sourceRefs ?? [],
    observedFacts: input.observedFacts ?? [],
    findings: input.findings ?? [],
    proposedActions: input.proposedActions ?? [],
    error: input.error ?? null,
    unavailableReason: input.unavailableReason ?? null,
  }
}

function statusFromReadError(error: string | null): AutonomousOperationStatus {
  return error === null ? 'PASS' : 'UNAVAILABLE'
}

function buildSourceReadFact(input: {
  id: string
  label: string
  error: string | null
  totalCount: number | null
  sourceRef: EvidenceRef
}): AutonomousObservedFact {
  const status = statusFromReadError(input.error)
  const value = status === 'PASS'
    ? `${input.totalCount ?? 0} records read`
    : `${input.error ?? 'source_unavailable'}`

  return buildObservedFact({
    id: input.id,
    label: input.label,
    value,
    status,
    evidenceClass: status === 'PASS' ? 'REAL' : 'UNKNOWN',
    sourceRefs: [input.sourceRef],
  })
}

function buildSystemHealthOperation(
  input: BuildAutonomousOperationsInput,
  startedAt: string,
  completedAt: string,
): AutonomousOperationRun {
  const observedFacts: AutonomousObservedFact[] = [
    buildObservedFact({
      id: 'lint_status',
      label: 'npm run lint status',
      value: 'not executed by runtime projection',
      status: 'NOT_CHECKED',
      sourceRefs: [SOURCE_REFS.repository],
    }),
    buildObservedFact({
      id: 'typescript_status',
      label: 'npx tsc --noEmit status',
      value: 'not executed by runtime projection',
      status: 'NOT_CHECKED',
      sourceRefs: [SOURCE_REFS.repository],
    }),
    buildObservedFact({
      id: 'build_status',
      label: 'npm run build status',
      value: 'not executed by runtime projection',
      status: 'NOT_CHECKED',
      sourceRefs: [SOURCE_REFS.repository],
    }),
    buildSourceReadFact({
      id: 'airtable_decision_adapter',
      label: 'Airtable Decision adapter',
      error: input.decisions.error,
      totalCount: input.decisions.error === null ? input.decisions.data.length : null,
      sourceRef: SOURCE_REFS.airtableDecision,
    }),
    buildSourceReadFact({
      id: 'airtable_customer_growth_adapter',
      label: 'Airtable Customer Growth adapter',
      error: input.customerGrowth.error,
      totalCount: input.customerGrowth.error === null ? input.customerGrowth.data.length : null,
      sourceRef: SOURCE_REFS.airtableCustomerGrowth,
    }),
    buildSourceReadFact({
      id: 'content_registry_adapter',
      label: 'Content Registry adapter',
      error: input.contentRegistry.error,
      totalCount: input.contentRegistry.error === null ? input.contentRegistry.data.length : null,
      sourceRef: SOURCE_REFS.contentRegistry,
    }),
    buildObservedFact({
      id: 'run_history_persistence',
      label: 'Run History persistence',
      value: 'not connected in v0.1',
      status: 'UNAVAILABLE',
      sourceRefs: [SOURCE_REFS.workGraph],
    }),
    buildObservedFact({
      id: 'approval_queue_persistence',
      label: 'Approval Queue persistence',
      value: 'in-memory only',
      status: 'UNAVAILABLE',
      sourceRefs: [SOURCE_REFS.approvalQueue],
    }),
  ]

  const findings = observedFacts
    .filter((fact) => fact.status !== 'PASS')
    .map((fact) => buildFinding({
      id: fact.id,
      operationType: 'OS_HEALTH_CHECK',
      title: fact.label,
      summary: fact.value,
      status: fact.status,
      severity: fact.status === 'UNAVAILABLE' ? 'MEDIUM' : 'INFO',
      sourceRefs: fact.sourceRefs,
      patrolOutcome: 'NO_ACTION',
    }))

  return buildOperationRun({
    operationId: 'os-health-check-v0.1',
    operationType: 'OS_HEALTH_CHECK',
    startedAt,
    completedAt,
    status: aggregateStatus(observedFacts.map((fact) => fact.status), 'UNKNOWN'),
    sourceRefs: [
      SOURCE_REFS.repository,
      SOURCE_REFS.airtableDecision,
      SOURCE_REFS.airtableCustomerGrowth,
      SOURCE_REFS.contentRegistry,
      SOURCE_REFS.workGraph,
    ],
    observedFacts,
    findings,
    unavailableReason: findings.some((finding) => finding.status === 'UNAVAILABLE')
      ? 'Some sources or durable stores are not connected in this slice.'
      : null,
  })
}

function buildEngineeringTriageOperation(
  input: BuildAutonomousOperationsInput,
  startedAt: string,
  completedAt: string,
): AutonomousOperationRun {
  const engineering = input.engineering
  const sourceRefs = engineering?.sourceRefs?.length
    ? engineering.sourceRefs
    : [SOURCE_REFS.repository]

  const observedFacts: AutonomousObservedFact[] = [
    buildObservedFact({
      id: 'ci_status',
      label: 'CI status',
      value: engineering?.failedCiCount === undefined ? 'not checked' : engineering.failedCiCount ?? 0,
      status: engineering?.failedCiCount === undefined
        ? 'NOT_CHECKED'
        : engineering.failedCiCount && engineering.failedCiCount > 0 ? 'FAIL' : 'PASS',
      sourceRefs,
    }),
    buildObservedFact({
      id: 'deployment_status',
      label: 'Deployment status',
      value: engineering?.failedDeploymentCount === undefined
        ? 'not checked'
        : engineering.failedDeploymentCount ?? 0,
      status: engineering?.failedDeploymentCount === undefined
        ? 'NOT_CHECKED'
        : engineering.failedDeploymentCount && engineering.failedDeploymentCount > 0 ? 'FAIL' : 'PASS',
      sourceRefs,
    }),
    buildObservedFact({
      id: 'draft_pr_attention',
      label: 'Open draft PRs requiring attention',
      value: engineering?.openDraftPrCount === undefined ? 'not checked' : engineering.openDraftPrCount ?? 0,
      status: engineering?.openDraftPrCount === undefined
        ? 'NOT_CHECKED'
        : engineering.openDraftPrCount && engineering.openDraftPrCount > 0 ? 'UNKNOWN' : 'PASS',
      sourceRefs,
    }),
    buildObservedFact({
      id: 'review_comment_attention',
      label: 'Review comments requiring action',
      value: engineering?.unresolvedReviewCommentCount === undefined
        ? 'not checked'
        : engineering.unresolvedReviewCommentCount ?? 0,
      status: engineering?.unresolvedReviewCommentCount === undefined
        ? 'NOT_CHECKED'
        : engineering.unresolvedReviewCommentCount && engineering.unresolvedReviewCommentCount > 0 ? 'UNKNOWN' : 'PASS',
      sourceRefs,
    }),
    buildObservedFact({
      id: 'stale_engineering_candidates',
      label: 'Stale engineering candidates',
      value: engineering?.staleEngineeringCandidateCount === undefined
        ? 'not checked'
        : engineering.staleEngineeringCandidateCount ?? 0,
      status: engineering?.staleEngineeringCandidateCount === undefined
        ? 'NOT_CHECKED'
        : engineering.staleEngineeringCandidateCount && engineering.staleEngineeringCandidateCount > 0 ? 'UNKNOWN' : 'PASS',
      sourceRefs,
    }),
  ]
  const needsReview = observedFacts.some((fact) => fact.status === 'FAIL' || fact.status === 'UNKNOWN')
  const proposedActions = needsReview
    ? [evaluateAutonomyPolicy({ actionKind: 'propose_code_fix', materialHumanDecision: true })]
    : []
  const findings = observedFacts
    .filter((fact) => fact.status !== 'PASS')
    .map((fact) => buildFinding({
      id: fact.id,
      operationType: 'ENGINEERING_TRIAGE',
      title: fact.label,
      summary: fact.value,
      status: fact.status,
      severity: fact.status === 'FAIL' ? 'HIGH' : 'INFO',
      sourceRefs: fact.sourceRefs,
      reasonForHuman: needsReview ? 'Engineering evidence may change the next development action.' : null,
      proposedAction: needsReview ? 'Review the externally observed engineering evidence before changing code.' : null,
      patrolOutcome: needsReview ? 'REVIEW_CANDIDATE' : 'NO_ACTION',
    }))

  return buildOperationRun({
    operationId: 'engineering-triage-v0.1',
    operationType: 'ENGINEERING_TRIAGE',
    startedAt,
    completedAt,
    status: aggregateStatus(observedFacts.map((fact) => fact.status), 'NOT_CHECKED'),
    sourceRefs,
    observedFacts,
    findings,
    proposedActions,
  })
}

function buildDecisionClassificationFacts(
  decisions: readonly AirtableDecisionRecord[],
): readonly AutonomousObservedFact[] {
  const counts = countEvidenceClasses(
    decisions.map((decision) => toAutonomousEvidenceClass(classifyDecisionEvidence(decision))),
  )

  return [
    buildObservedFact({
      id: 'decision_evidence_real',
      label: 'Decision REAL evidence',
      value: counts.REAL,
      status: counts.REAL > 0 ? 'PASS' : 'UNKNOWN',
      evidenceClass: 'REAL',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }),
    buildObservedFact({
      id: 'decision_evidence_sample_test',
      label: 'Decision SAMPLE / TEST excluded',
      value: counts.SAMPLE + counts.TEST,
      status: 'PASS',
      evidenceClass: 'SAMPLE',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }),
    buildObservedFact({
      id: 'decision_evidence_unknown',
      label: 'Decision UNKNOWN evidence',
      value: counts.UNKNOWN,
      status: counts.UNKNOWN > 0 ? 'UNKNOWN' : 'PASS',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }),
  ]
}

function buildCustomerClassificationFacts(
  customers: readonly CustomerGrowthRecord[],
): readonly AutonomousObservedFact[] {
  const counts = countEvidenceClasses(
    customers.map((customer) => toAutonomousEvidenceClass(classifyCustomerEvidence(customer))),
  )

  return [
    buildObservedFact({
      id: 'customer_growth_real',
      label: 'Customer Growth REAL evidence',
      value: counts.REAL,
      status: counts.REAL > 0 ? 'PASS' : 'UNKNOWN',
      evidenceClass: 'REAL',
      sourceRefs: [SOURCE_REFS.airtableCustomerGrowth],
    }),
    buildObservedFact({
      id: 'customer_growth_sample_test',
      label: 'Customer Growth SAMPLE / TEST excluded',
      value: counts.SAMPLE + counts.TEST,
      status: 'PASS',
      evidenceClass: 'SAMPLE',
      sourceRefs: [SOURCE_REFS.airtableCustomerGrowth],
    }),
    buildObservedFact({
      id: 'customer_growth_unknown',
      label: 'Customer Growth UNKNOWN evidence',
      value: counts.UNKNOWN,
      status: counts.UNKNOWN > 0 ? 'UNKNOWN' : 'PASS',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableCustomerGrowth],
    }),
  ]
}

function buildDataQualityOperation(
  input: BuildAutonomousOperationsInput,
  startedAt: string,
  completedAt: string,
): AutonomousOperationRun {
  const findings: AutonomousOperationFinding[] = []
  const observedFacts: AutonomousObservedFact[] = [
    buildSourceReadFact({
      id: 'decision_source_read',
      label: 'Decision source read',
      error: input.decisions.error,
      totalCount: input.decisions.error === null ? input.decisions.data.length : null,
      sourceRef: SOURCE_REFS.airtableDecision,
    }),
    buildSourceReadFact({
      id: 'customer_growth_source_read',
      label: 'Customer Growth source read',
      error: input.customerGrowth.error,
      totalCount: input.customerGrowth.error === null ? input.customerGrowth.data.length : null,
      sourceRef: SOURCE_REFS.airtableCustomerGrowth,
    }),
    buildSourceReadFact({
      id: 'content_registry_source_read',
      label: 'Content Registry source read',
      error: input.contentRegistry.error,
      totalCount: input.contentRegistry.error === null ? input.contentRegistry.data.length : null,
      sourceRef: SOURCE_REFS.contentRegistry,
    }),
    ...buildDecisionClassificationFacts(input.decisions.data),
    ...buildCustomerClassificationFacts(input.customerGrowth.data),
  ]

  if (input.decisions.error) {
    findings.push(buildFinding({
      id: `decision_read_${input.decisions.error}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Decision source unavailable',
      summary: 'Decision data could not be read, so downstream checks stay unavailable.',
      status: 'UNAVAILABLE',
      severity: 'HIGH',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }))
  }

  if (input.customerGrowth.error) {
    findings.push(buildFinding({
      id: `customer_growth_read_${input.customerGrowth.error}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Customer Growth source unavailable',
      summary: 'Customer Growth data could not be read, so operational customer evidence is unavailable.',
      status: 'UNAVAILABLE',
      severity: 'HIGH',
      sourceRefs: [SOURCE_REFS.airtableCustomerGrowth],
    }))
  }

  if (input.contentRegistry.error) {
    findings.push(buildFinding({
      id: `content_read_${input.contentRegistry.error}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Content Registry source unavailable',
      summary: 'Content Registry read failed or is not configured. No fallback is promoted as REAL.',
      status: 'UNAVAILABLE',
      severity: 'HIGH',
      sourceRefs: [SOURCE_REFS.contentRegistry],
    }))
  }

  const decisionUnknownCount = input.decisions.data
    .filter((decision) => classifyDecisionEvidence(decision) === 'UNKNOWN')
    .length
  if (decisionUnknownCount > 0) {
    findings.push(buildFinding({
      id: `decision_unknown_${decisionUnknownCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Decision evidence classification is UNKNOWN',
      summary: `${decisionUnknownCount} Decision records have no explicit REAL evidence classification.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }))
  }

  const customerUnknownCount = input.customerGrowth.data
    .filter((customer) => classifyCustomerEvidence(customer) === 'UNKNOWN')
    .length
  if (customerUnknownCount > 0) {
    findings.push(buildFinding({
      id: `customer_unknown_${customerUnknownCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Customer Growth evidence classification is UNKNOWN',
      summary: `${customerUnknownCount} Customer Growth records have unknown or blank dataKind.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableCustomerGrowth],
    }))
  }

  const unlinkedDecisionCount = input.decisions.data
    .filter((decision) => !decision.customerId || !decision.visitId)
    .length
  if (unlinkedDecisionCount > 0) {
    findings.push(buildFinding({
      id: `decision_unlinked_${unlinkedDecisionCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Decision records include unlinked Customer / Visit context',
      summary: `${unlinkedDecisionCount} Decision records are not fully linked. This is allowed for Decision Input v0.1.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableDecision],
    }))
  }

  const openNextObservationCount = input.decisions.data
    .filter((decision) => decision.values.nextObservation && decision.validation === null)
    .length
  if (openNextObservationCount > 0) {
    findings.push(buildFinding({
      id: `next_observation_without_validation_${openNextObservationCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Next Observation exists without Validation',
      summary: `${openNextObservationCount} Decision loop items still need later validation. This is a loop finding, not treatment failure.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.airtableDecision],
      reasonForHuman: 'Ikeda may choose when to validate the open observation.',
      proposedAction: 'Review only when the next salon context makes the validation actionable.',
      patrolOutcome: 'REVIEW_CANDIDATE',
    }))
  }

  const missingBodySourceCount = input.contentRegistry.data
    .filter((item) => item.bodySyncStatus === 'BODY_SOURCE_MISSING')
    .length
  if (missingBodySourceCount > 0) {
    findings.push(buildFinding({
      id: `content_body_missing_${missingBodySourceCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Content body source is missing',
      summary: `${missingBodySourceCount} Content Registry items are missing canonical body source.`,
      status: 'FAIL',
      severity: 'MEDIUM',
      sourceRefs: [SOURCE_REFS.contentRegistry],
      reasonForHuman: 'Source repair may change what gets reviewed or published later.',
      proposedAction: 'Review body-source connection candidates before any publishing or productization action.',
      patrolOutcome: 'REVIEW_CANDIDATE',
    }))
  }

  const syncDriftCount = input.contentRegistry.data
    .filter((item) => item.bodySyncStatus === 'SYNC_DRIFT')
    .length
  if (syncDriftCount > 0) {
    findings.push(buildFinding({
      id: `content_sync_drift_${syncDriftCount}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Content source sync drift detected',
      summary: `${syncDriftCount} Content Registry items may differ from canonical body source.`,
      status: 'FAIL',
      severity: 'MEDIUM',
      sourceRefs: [SOURCE_REFS.contentRegistry],
      reasonForHuman: 'Drift can change the next content action.',
      proposedAction: 'Review drift before generating any content candidate.',
      patrolOutcome: 'REVIEW_CANDIDATE',
    }))
  }

  const missingContentEvidenceRefs = input.contentRegistry.data
    .filter((item) => item.evidenceRefs.length === 0)
    .length
  if (missingContentEvidenceRefs > 0) {
    findings.push(buildFinding({
      id: `content_evidence_refs_missing_${missingContentEvidenceRefs}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Content sourceRefs are missing',
      summary: `${missingContentEvidenceRefs} Content Registry items have no evidence refs.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.contentRegistry],
    }))
  }

  const revenueSignalsMissingRefs = input.revenue.signals
    .filter((signal) => signal.evidenceRefs.length === 0)
    .length
  if (revenueSignalsMissingRefs > 0) {
    findings.push(buildFinding({
      id: `revenue_signal_refs_missing_${revenueSignalsMissingRefs}`,
      operationType: 'DATA_QUALITY_AUDIT',
      title: 'Revenue Signal sourceRefs are missing',
      summary: `${revenueSignalsMissingRefs} Revenue Signals have no sourceRefs and cannot be treated as operational evidence.`,
      status: 'UNKNOWN',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.workGraph],
    }))
  }

  const proposedActions = findings
    .filter((finding) => finding.patrolOutcome === 'REVIEW_CANDIDATE')
    .map((finding) => evaluateAutonomyPolicy({
      actionKind: finding.title.startsWith('Content') ? 'content_candidate' : 'non_destructive_remediation',
      materialHumanDecision: true,
    }))

  return buildOperationRun({
    operationId: 'data-quality-audit-v0.1',
    operationType: 'DATA_QUALITY_AUDIT',
    startedAt,
    completedAt,
    status: aggregateStatus([...observedFacts.map((fact) => fact.status), ...findings.map((finding) => finding.status)], 'PASS'),
    sourceRefs: [
      SOURCE_REFS.airtableDecision,
      SOURCE_REFS.airtableCustomerGrowth,
      SOURCE_REFS.contentRegistry,
      SOURCE_REFS.workGraph,
    ],
    observedFacts,
    findings,
    proposedActions,
    unavailableReason: findings.some((finding) => finding.status === 'UNAVAILABLE')
      ? 'One or more source reads failed closed.'
      : null,
  })
}

function buildPatrolResult(input: {
  domain: DepartmentPatrolDomain
  displayName: string
  sourceAgent: CoreAgentId
  observedFacts: readonly AutonomousObservedFact[]
  findings: readonly AutonomousOperationFinding[]
  fallbackSummary: string
  reviewActionKind?: Parameters<typeof evaluateAutonomyPolicy>[0]['actionKind']
}): DepartmentPatrolResult {
  const reviewFindings = input.findings.filter((finding) => finding.patrolOutcome === 'REVIEW_CANDIDATE')
  const approvalFindings = input.findings.filter((finding) => finding.patrolOutcome === 'APPROVAL_REQUIRED')
  const unavailableFindings = input.findings.filter((finding) => finding.status === 'UNAVAILABLE')
  const status = aggregateStatus([
    ...input.observedFacts.map((fact) => fact.status),
    ...input.findings.map((finding) => finding.status),
  ], 'NO_ACTION')
  const outcome: DepartmentPatrolOutcome = approvalFindings.length > 0
    ? 'APPROVAL_REQUIRED'
    : reviewFindings.length > 0
      ? 'REVIEW_CANDIDATE'
      : unavailableFindings.length > 0
        ? 'AUTO_RESULT'
        : 'NO_ACTION'
  const proposedAction = outcome === 'REVIEW_CANDIDATE'
    ? evaluateAutonomyPolicy({
      actionKind: input.reviewActionKind ?? 'non_destructive_remediation',
      materialHumanDecision: true,
    })
    : outcome === 'APPROVAL_REQUIRED'
      ? evaluateAutonomyPolicy({
        actionKind: 'promote_canonical_knowledge',
        materialHumanDecision: true,
      })
      : outcome === 'AUTO_RESULT'
        ? evaluateAutonomyPolicy({ actionKind: 'summarize', materialHumanDecision: false })
        : null

  return {
    domain: input.domain,
    displayName: input.displayName,
    status: outcome === 'NO_ACTION' && status === 'PASS' ? 'NO_ACTION' : status,
    outcome,
    sourceAgent: input.sourceAgent,
    summary: reviewFindings[0]?.summary
      ?? approvalFindings[0]?.summary
      ?? unavailableFindings[0]?.summary
      ?? input.fallbackSummary,
    observedFacts: input.observedFacts,
    findings: input.findings,
    proposedAction,
  }
}

function buildDepartmentPatrol(
  input: {
    health: AutonomousOperationRun
    engineeringTriage: AutonomousOperationRun
    dataQuality: AutonomousOperationRun
    revenue: RevenueIntelligenceProjection
    startedAt: string
    completedAt: string
  },
): {
  run: AutonomousOperationRun
  patrolResults: readonly DepartmentPatrolResult[]
} {
  const dataFindings = input.dataQuality.findings
  const contentFindings = dataFindings.filter((finding) =>
    finding.sourceRefs.some((ref) => ref.id === SOURCE_REFS.contentRegistry.id),
  )
  const customerFindings = dataFindings.filter((finding) =>
    finding.sourceRefs.some((ref) => ref.id === SOURCE_REFS.airtableDecision.id || ref.id === SOURCE_REFS.airtableCustomerGrowth.id),
  )
  const engineeringFindings = [...input.health.findings, ...input.engineeringTriage.findings]
  const revenueFacts: AutonomousObservedFact[] = [
    buildObservedFact({
      id: 'revenue_real_signal_count',
      label: 'REAL Revenue Signals',
      value: input.revenue.realSignalCount,
      status: input.revenue.realSignalCount > 0 ? 'PASS' : 'NO_ACTION',
      evidenceClass: input.revenue.realSignalCount > 0 ? 'REAL' : 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.workGraph],
    }),
    buildObservedFact({
      id: 'revenue_unknown_excluded',
      label: 'Revenue UNKNOWN excluded',
      value: input.revenue.unknownExcludedCount,
      status: input.revenue.unknownExcludedCount > 0 ? 'UNKNOWN' : 'PASS',
      evidenceClass: 'UNKNOWN',
      sourceRefs: [SOURCE_REFS.workGraph],
    }),
  ]
  const knowledgeFacts: AutonomousObservedFact[] = [
    buildObservedFact({
      id: 'knowledge_reader_status',
      label: 'Knowledge reader',
      value: 'not connected in this branch',
      status: 'UNAVAILABLE',
      sourceRefs: [SOURCE_REFS.workGraph],
    }),
  ]
  const patrolResults = [
    buildPatrolResult({
      domain: 'CUSTOMER',
      displayName: 'Customer',
      sourceAgent: 'salon-customer-intelligence',
      observedFacts: input.dataQuality.observedFacts.filter((fact) =>
        fact.sourceRefs.some((ref) => ref.id === SOURCE_REFS.airtableDecision.id || ref.id === SOURCE_REFS.airtableCustomerGrowth.id),
      ),
      findings: customerFindings,
      fallbackSummary: 'Customer patrol found no action beyond source-aware observation.',
    }),
    buildPatrolResult({
      domain: 'KNOWLEDGE',
      displayName: 'Knowledge',
      sourceAgent: 'decision-learning-intelligence',
      observedFacts: knowledgeFacts,
      findings: [],
      fallbackSummary: 'Knowledge reader is not connected, so no Knowledge promotion is attempted.',
    }),
    buildPatrolResult({
      domain: 'CONTENT',
      displayName: 'Content',
      sourceAgent: 'content-product-intelligence',
      observedFacts: input.dataQuality.observedFacts.filter((fact) =>
        fact.sourceRefs.some((ref) => ref.id === SOURCE_REFS.contentRegistry.id),
      ),
      findings: contentFindings,
      fallbackSummary: 'Content patrol has no actionable source issue.',
      reviewActionKind: 'content_candidate',
    }),
    buildPatrolResult({
      domain: 'GROWTH_REVENUE',
      displayName: 'Growth / Revenue',
      sourceAgent: 'growth-market-intelligence',
      observedFacts: revenueFacts,
      findings: input.revenue.errors.map((error) => buildFinding({
        id: `revenue_error_${error}`,
        operationType: 'DEPARTMENT_PATROL',
        title: 'Revenue source unavailable',
        summary: error,
        status: 'UNAVAILABLE',
        severity: 'HIGH',
        sourceRefs: [SOURCE_REFS.workGraph],
      })),
      fallbackSummary: input.revenue.realSignalCount === 0
        ? 'No REAL Revenue Signal was detected. Zero is a valid result.'
        : `${input.revenue.realSignalCount} REAL Revenue Signals were observed.`,
    }),
    buildPatrolResult({
      domain: 'ENGINEERING_OPERATIONS',
      displayName: 'Engineering / Operations',
      sourceAgent: 'content-product-intelligence',
      observedFacts: [...input.health.observedFacts, ...input.engineeringTriage.observedFacts],
      findings: engineeringFindings,
      fallbackSummary: 'Engineering patrol has no externally observed action.',
      reviewActionKind: 'propose_code_fix',
    }),
  ] as const
  const proposedActions = patrolResults
    .map((result) => result.proposedAction)
    .filter((decision): decision is AutonomyPolicyDecision => decision !== null)
  const run = buildOperationRun({
    operationId: 'department-patrol-v0.1',
    operationType: 'DEPARTMENT_PATROL',
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    status: aggregateStatus(patrolResults.map((result) => result.status), 'NO_ACTION'),
    sourceRefs: [
      SOURCE_REFS.airtableDecision,
      SOURCE_REFS.airtableCustomerGrowth,
      SOURCE_REFS.contentRegistry,
      SOURCE_REFS.workGraph,
    ],
    observedFacts: patrolResults.flatMap((result) => result.observedFacts),
    findings: patrolResults.flatMap((result) => result.findings),
    proposedActions,
  })

  return { run, patrolResults }
}

function buildWeeklyReview(input: {
  health: AutonomousOperationRun
  engineeringTriage: AutonomousOperationRun
  dataQuality: AutonomousOperationRun
  departmentPatrol: AutonomousOperationRun
  patrolResults: readonly DepartmentPatrolResult[]
  startedAt: string
  completedAt: string
}): {
  run: AutonomousOperationRun
  review: WeeklyOperationsReview
} {
  const operationRuns = [
    input.health,
    input.engineeringTriage,
    input.dataQuality,
    input.departmentPatrol,
  ]
  const allFindings = operationRuns.flatMap((run) => run.findings)
  const allFacts = operationRuns.flatMap((run) => run.observedFacts)
  const reviewCandidates = input.patrolResults.filter((result) => result.outcome === 'REVIEW_CANDIDATE')
  const approvalRequired = input.patrolResults.filter((result) => result.outcome === 'APPROVAL_REQUIRED')
  const noActionCount = input.patrolResults.filter((result) => result.outcome === 'NO_ACTION').length
  const unknownCoverageFacts = allFacts.filter((fact) =>
    fact.status === 'UNKNOWN'
    || fact.status === 'UNAVAILABLE'
    || fact.status === 'NOT_CHECKED',
  )
  const sourceCoverageSummary = [
    buildObservedFact({
      id: 'weekly_health_status',
      label: 'System health',
      value: input.health.status,
      status: input.health.status,
      sourceRefs: input.health.sourceRefs,
    }),
    buildObservedFact({
      id: 'weekly_data_quality_status',
      label: 'Data quality',
      value: input.dataQuality.status,
      status: input.dataQuality.status,
      sourceRefs: input.dataQuality.sourceRefs,
    }),
    buildObservedFact({
      id: 'weekly_patrol_status',
      label: 'Department patrol',
      value: input.departmentPatrol.status,
      status: input.departmentPatrol.status,
      sourceRefs: input.departmentPatrol.sourceRefs,
    }),
  ]
  const review: WeeklyOperationsReview = {
    status: aggregateStatus([
      input.health.status,
      input.engineeringTriage.status,
      input.dataQuality.status,
      input.departmentPatrol.status,
    ], noActionCount > 0 ? 'NO_ACTION' : 'PASS'),
    observedFacts: [
      buildObservedFact({
        id: 'weekly_observed_fact_boundary',
        label: 'Observed facts boundary',
        value: 'Facts are counted separately from proposed actions.',
        status: 'PASS',
        sourceRefs: [SOURCE_REFS.workGraph],
      }),
    ],
    healthIssueCount: input.health.findings
      .filter((finding) => finding.status !== 'PASS' && finding.status !== 'NO_ACTION')
      .length,
    dataQualityFindingCount: input.dataQuality.findings.length,
    automaticObservationCount: allFacts.filter((fact) => fact.status === 'PASS' || fact.status === 'NO_ACTION').length,
    reviewCandidateCount: reviewCandidates.length,
    approvalRequiredCount: approvalRequired.length,
    unresolvedOrStaleCount: allFindings.filter((finding) =>
      finding.status === 'FAIL'
      || finding.status === 'UNKNOWN'
      || finding.status === 'UNAVAILABLE',
    ).length,
    noActionCount,
    unknownCoverageCount: unknownCoverageFacts.length,
    sourceCoverageSummary,
  }
  const proposedActions = input.patrolResults
    .map((result) => result.proposedAction)
    .filter((decision): decision is AutonomyPolicyDecision => decision !== null)
    .filter(shouldSurfaceAutonomousAction)

  return {
    review,
    run: buildOperationRun({
      operationId: 'weekly-operations-review-v0.1',
      operationType: 'WEEKLY_OPERATIONS_REVIEW',
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      status: review.status,
      sourceRefs: [SOURCE_REFS.workGraph],
      observedFacts: [...review.observedFacts, ...review.sourceCoverageSummary],
      findings: allFindings,
      proposedActions,
    }),
  }
}

export function buildAutonomousOperationsProjection(
  input: BuildAutonomousOperationsInput,
): AutonomousOperationsProjection {
  const now = input.now ?? new Date()
  const startedAt = now.toISOString()
  const completedAt = startedAt
  const health = buildSystemHealthOperation(input, startedAt, completedAt)
  const engineeringTriage = buildEngineeringTriageOperation(input, startedAt, completedAt)
  const dataQuality = buildDataQualityOperation(input, startedAt, completedAt)
  const { run: departmentPatrol, patrolResults } = buildDepartmentPatrol({
    health,
    engineeringTriage,
    dataQuality,
    revenue: input.revenue,
    startedAt,
    completedAt,
  })
  const { run: weeklyOperationsReview, review: weeklyReview } = buildWeeklyReview({
    health,
    engineeringTriage,
    dataQuality,
    departmentPatrol,
    patrolResults,
    startedAt,
    completedAt,
  })

  return {
    health,
    engineeringTriage,
    dataQuality,
    departmentPatrol,
    weeklyOperationsReview,
    patrolResults,
    weeklyReview,
    schedulerBoundary: {
      callable: true,
      schedulerConfigured: false,
      externalTriggerOnly: true,
      note: 'Deterministic functions are exposed for future Codex Automations; no in-app scheduler or cron is configured in v0.1.',
    },
  }
}
