import type {
  ApprovalLevel,
  AutonomyPolicyDecision,
  AutonomousActionKind,
} from '@/lib/types/ai-operations'

type AutonomyPolicyInput = {
  actionKind: AutonomousActionKind
  requestedLevel?: ApprovalLevel
  materialHumanDecision?: boolean
}

const AUTO_ACTIONS: readonly AutonomousActionKind[] = [
  'read',
  'inspect',
  'classify',
  'calculate',
  'detect',
  'summarize',
  'generate_candidate',
  'safe_deterministic_check',
]

const REVIEW_ACTIONS: readonly AutonomousActionKind[] = [
  'propose_code_fix',
  'propose_pr',
  'content_candidate',
  'knowledge_candidate',
  'experiment_candidate',
  'non_destructive_remediation',
]

const APPROVAL_REQUIRED_ACTIONS: readonly AutonomousActionKind[] = [
  'merge_main',
  'production_deploy',
  'public_publish',
  'customer_message',
  'delete_source_data',
  'destructive_schema_change',
  'promote_canonical_knowledge',
  'change_business_strategy',
]

function classifyAction(actionKind: AutonomousActionKind): ApprovalLevel {
  if (APPROVAL_REQUIRED_ACTIONS.includes(actionKind)) return 'APPROVAL'
  if (REVIEW_ACTIONS.includes(actionKind)) return 'REVIEW'
  if (AUTO_ACTIONS.includes(actionKind)) return 'AUTO'

  return 'REVIEW'
}

function strongestLevel(a: ApprovalLevel, b: ApprovalLevel): ApprovalLevel {
  if (a === 'APPROVAL' || b === 'APPROVAL') return 'APPROVAL'
  if (a === 'REVIEW' || b === 'REVIEW') return 'REVIEW'
  return 'AUTO'
}

function policyReason(level: ApprovalLevel, materialHumanDecision: boolean): string {
  if (level === 'APPROVAL') {
    return 'Irreversible, external, or canonical-state changing action requires explicit human approval.'
  }

  if (level === 'REVIEW') {
    return materialHumanDecision
      ? 'Human review can materially change the next action.'
      : 'Non-destructive candidate output is review-level but does not require queueing yet.'
  }

  return 'Read-only or deterministic work can run automatically and bypass the human queue.'
}

export function evaluateAutonomyPolicy(input: AutonomyPolicyInput): AutonomyPolicyDecision {
  const baselineLevel = classifyAction(input.actionKind)
  const executionLevel = input.requestedLevel
    ? strongestLevel(baselineLevel, input.requestedLevel)
    : baselineLevel
  const materialHumanDecision = Boolean(input.materialHumanDecision)

  return {
    actionKind: input.actionKind,
    executionLevel,
    canAutoExecute: executionLevel === 'AUTO',
    createsReviewCandidate: executionLevel === 'REVIEW' && materialHumanDecision,
    requiresApprovalQueueItem: executionLevel === 'APPROVAL' && materialHumanDecision,
    reason: policyReason(executionLevel, materialHumanDecision),
  }
}

export function shouldSurfaceAutonomousAction(decision: AutonomyPolicyDecision): boolean {
  return decision.createsReviewCandidate || decision.requiresApprovalQueueItem
}
