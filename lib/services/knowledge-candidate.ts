import type { AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'
import type { DecisionCoreFieldKey } from '@/lib/types/decision'
import type {
  KnowledgeCandidate,
  KnowledgeCandidateConfidence,
  KnowledgeCandidateEvaluation,
  KnowledgeCandidateValidationStatus,
  KnowledgeCaseSourceKind,
  KnowledgeDecisionCase,
  KnowledgeEvidenceClass,
} from '@/lib/types/knowledge-candidate'

type EvidenceClassificationInput = {
  explicitEvidenceClass?: KnowledgeEvidenceClass | string | null
  title?: string | null
  values?: Partial<Record<DecisionCoreFieldKey, string | null>> | null
  sourceKind?: KnowledgeCaseSourceKind | string | null
}

type CandidateEvaluationOptions = {
  targetDecision: KnowledgeDecisionCase
  comparisonDecisions: readonly KnowledgeDecisionCase[]
  now?: Date
  minSupportingCount?: number
  similarityThreshold?: number
}

type ScoredCase = {
  decision: KnowledgeDecisionCase
  score: number
}

const DEFAULT_MIN_SUPPORTING_COUNT = 2
const DEFAULT_SIMILARITY_THRESHOLD = 0.34
const TEST_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']
const TEST_WORDS = ['fixture', 'demo', 'synthetic']
const SAMPLE_WORDS = ['sample']
const TOKEN_MIN_LENGTH = 2
const TEXT_FIELDS: readonly DecisionCoreFieldKey[] = [
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

function normalizeEvidenceClass(value: KnowledgeEvidenceClass | string | null | undefined): KnowledgeEvidenceClass | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  if (
    normalized === 'REAL'
    || normalized === 'SAMPLE'
    || normalized === 'TEST'
    || normalized === 'UNKNOWN'
  ) {
    return normalized
  }

  return null
}

function joinedDecisionText(input: EvidenceClassificationInput): string {
  return [
    input.title,
    ...TEXT_FIELDS.map((field) => input.values?.[field]),
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
}

function hasTestMarker(text: string): boolean {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()

  return (
    TEST_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
    || TEST_WORDS.some((word) => lower.includes(word))
  )
}

function hasSampleMarker(text: string): boolean {
  const lower = text.trim().toLowerCase()
  return SAMPLE_WORDS.some((word) => lower.includes(word))
}

export function classifyKnowledgeDecisionEvidence(
  input: EvidenceClassificationInput,
): KnowledgeEvidenceClass {
  const sourceKind = typeof input.sourceKind === 'string'
    ? input.sourceKind.trim().toLowerCase()
    : ''
  const text = joinedDecisionText(input)

  if (sourceKind === 'fixture' || sourceKind === 'demo' || sourceKind === 'synthetic' || hasTestMarker(text)) {
    return 'TEST'
  }

  if (hasSampleMarker(text)) {
    return 'SAMPLE'
  }

  const explicit = normalizeEvidenceClass(input.explicitEvidenceClass)
  if (explicit) {
    return explicit
  }

  return 'UNKNOWN'
}

export function projectAirtableDecisionToKnowledgeCase(
  record: AirtableDecisionRecord,
): KnowledgeDecisionCase {
  const evidenceClass = classifyKnowledgeDecisionEvidence({
    title: record.title,
    values: record.values,
    sourceKind: 'airtable',
  })

  return {
    decisionId: record.id,
    title: record.title,
    values: record.values,
    evidenceClass,
    sourceKind: 'airtable',
    outcome: null,
    validation: 'UNOBSERVED',
  }
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\b(?:\+?\d[\d -]{8,}\d)\b/g, '[redacted-phone]')
}

function safeExcerpt(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const redacted = redactSensitiveText(value.trim())
  if (!redacted) return fallback
  return redacted.length > 80 ? `${redacted.slice(0, 80)}...` : redacted
}

function normalizedText(value: string | null | undefined): string {
  return redactSensitiveText(value ?? '')
    .toLowerCase()
    .replace(/[【】]/g, ' ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
}

function tokenize(value: string | null | undefined): Set<string> {
  const normalized = normalizedText(value)
  if (!normalized) return new Set()

  const words = normalized
    .split(/\s+/)
    .filter((word) => word.length >= TOKEN_MIN_LENGTH)

  if (words.length >= 2) {
    return new Set(words)
  }

  const compact = normalized.replace(/\s+/g, '')
  const grams: string[] = []
  for (let index = 0; index < compact.length - 1; index += 1) {
    grams.push(compact.slice(index, index + 2))
  }

  return new Set(grams.length > 0 ? grams : words)
}

function unionTokenSets(sets: readonly Set<string>[]): Set<string> {
  const union = new Set<string>()
  sets.forEach((set) => {
    set.forEach((token) => union.add(token))
  })
  return union
}

function tokensForFields(
  decision: KnowledgeDecisionCase,
  fields: readonly DecisionCoreFieldKey[],
): Set<string> {
  return unionTokenSets(fields.map((field) => tokenize(decision.values[field])))
}

function intersectionSize(left: Set<string>, right: Set<string>): number {
  let count = 0
  left.forEach((token) => {
    if (right.has(token)) count += 1
  })
  return count
}

function overlapScore(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0
  return intersectionSize(left, right) / Math.min(left.size, right.size)
}

function similarityScore(left: KnowledgeDecisionCase, right: KnowledgeDecisionCase): number {
  const contextFields: readonly DecisionCoreFieldKey[] = ['consultationConcern', 'customerTruth']
  const actionFields: readonly DecisionCoreFieldKey[] = ['chosenDecision', 'notChosen']
  const contextScore = overlapScore(tokensForFields(left, contextFields), tokensForFields(right, contextFields))
  const actionScore = overlapScore(tokensForFields(left, actionFields), tokensForFields(right, actionFields))

  return (contextScore * 0.58) + (actionScore * 0.42)
}

function isContradicted(decision: KnowledgeDecisionCase): boolean {
  return decision.validation === 'CONTRADICTED'
}

function hasOutcomeOrSupport(decision: KnowledgeDecisionCase): boolean {
  return Boolean(decision.outcome)
    || decision.validation === 'SUPPORTED'
    || decision.validation === 'PARTIALLY_SUPPORTED'
}

function hasActionConflict(target: KnowledgeDecisionCase, comparison: KnowledgeDecisionCase): boolean {
  const targetChosen = tokensForFields(target, ['chosenDecision'])
  const targetNotChosen = tokensForFields(target, ['notChosen'])
  const comparisonChosen = tokensForFields(comparison, ['chosenDecision'])
  const comparisonNotChosen = tokensForFields(comparison, ['notChosen'])

  return overlapScore(targetChosen, comparisonNotChosen) >= 0.5
    || overlapScore(targetNotChosen, comparisonChosen) >= 0.5
    || isContradicted(comparison)
}

function buildScoredCases(
  target: KnowledgeDecisionCase,
  comparisons: readonly KnowledgeDecisionCase[],
): readonly ScoredCase[] {
  return comparisons
    .filter((decision) =>
      decision.decisionId !== target.decisionId && decision.evidenceClass === 'REAL')
    .map((decision) => ({
      decision,
      score: similarityScore(target, decision),
    }))
}

function selectSupportingCases(
  scoredCases: readonly ScoredCase[],
  threshold: number,
): readonly ScoredCase[] {
  return scoredCases.filter((scored) => scored.score >= threshold && !isContradicted(scored.decision))
}

function selectCounterEvidence(
  target: KnowledgeDecisionCase,
  scoredCases: readonly ScoredCase[],
  threshold: number,
): readonly KnowledgeDecisionCase[] {
  return scoredCases
    .filter((scored) => scored.score >= threshold * 0.75)
    .map((scored) => scored.decision)
    .filter((decision) => hasActionConflict(target, decision))
}

function buildValidationStatus(
  supportingCases: readonly KnowledgeDecisionCase[],
  counterEvidence: readonly KnowledgeDecisionCase[],
): KnowledgeCandidateValidationStatus {
  if (counterEvidence.some(isContradicted)) return 'CONTRADICTED'
  if (supportingCases.some(hasOutcomeOrSupport)) return 'PARTIALLY_VALIDATED'
  return 'UNVALIDATED'
}

function buildConfidence(
  supportingCount: number,
  validationStatus: KnowledgeCandidateValidationStatus,
  counterEvidenceCount: number,
): KnowledgeCandidateConfidence {
  if (counterEvidenceCount > 0 || validationStatus === 'UNVALIDATED') return 'LOW'
  if (supportingCount >= 3 && validationStatus === 'PARTIALLY_VALIDATED') return 'MEDIUM'
  return 'LOW'
}

function commonTokenLabels(target: KnowledgeDecisionCase, supportingCases: readonly KnowledgeDecisionCase[]): readonly string[] {
  const contextTokens = tokensForFields(target, ['consultationConcern', 'customerTruth'])
  const actionTokens = tokensForFields(target, ['chosenDecision', 'notChosen'])
  const sharedContext = new Set<string>()
  const sharedAction = new Set<string>()

  supportingCases.forEach((decision) => {
    const decisionContext = tokensForFields(decision, ['consultationConcern', 'customerTruth'])
    const decisionAction = tokensForFields(decision, ['chosenDecision', 'notChosen'])

    contextTokens.forEach((token) => {
      if (decisionContext.has(token)) sharedContext.add(token)
    })
    actionTokens.forEach((token) => {
      if (decisionAction.has(token)) sharedAction.add(token)
    })
  })

  return [
    sharedContext.size > 0 ? '相談または確認事実に説明可能な共通点がある' : null,
    sharedAction.size > 0 ? '選んだ判断またはあえてしなかったことに共通点がある' : null,
  ].filter((label): label is string => label !== null)
}

function buildCandidate(
  target: KnowledgeDecisionCase,
  supportingCases: readonly KnowledgeDecisionCase[],
  counterEvidence: readonly KnowledgeDecisionCase[],
  now: Date,
): KnowledgeCandidate {
  const createdAt = now.toISOString()
  const evidenceDecisionIds = [target, ...supportingCases].map((decision) => decision.decisionId)
  const validationStatus = buildValidationStatus(supportingCases, counterEvidence)
  const supportingCount = evidenceDecisionIds.length
  const confidence = buildConfidence(supportingCount, validationStatus, counterEvidence.length)
  const chosenDecision = safeExcerpt(target.values.chosenDecision, '今回の判断')
  const notChosen = safeExcerpt(target.values.notChosen, 'あえてしなかったこと')

  return {
    candidateId: `knowledge_candidate_${stableHash(evidenceDecisionIds.sort().join(':'))}`,
    title: `未検証の判断パターン: ${chosenDecision}`,
    statement: `${chosenDecision} は、似た条件では有効な判断パターンになる可能性がある。ただし ${notChosen} との比較、Outcome、反証Caseの確認が不足しているため未検証。`,
    conditions: commonTokenLabels(target, supportingCases),
    nonConditions: [
      '単一Caseだけでは正式Knowledgeにしない',
      'Outcomeが未確認のCaseだけでは確定しない',
      'Not Chosenや矛盾するOutcomeがある場合は成立条件を狭める',
    ],
    evidenceDecisionIds,
    supportingCount,
    counterEvidenceDecisionIds: counterEvidence.map((decision) => decision.decisionId),
    validationStatus,
    confidence,
    reasoningSummary: `${supportingCount}件の明示REAL Decisionで軽量類似性を確認。AI単独では正式Knowledgeへ昇格しない。`,
    createdAt,
    updatedAt: createdAt,
  }
}

export function evaluateKnowledgeCandidate(
  options: CandidateEvaluationOptions,
): KnowledgeCandidateEvaluation {
  const minSupportingCount = options.minSupportingCount ?? DEFAULT_MIN_SUPPORTING_COUNT
  const threshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD
  const target = options.targetDecision

  if (target.evidenceClass !== 'REAL') {
    return {
      status: 'NO_ACTION',
      reason: 'TARGET_NOT_REAL',
      candidate: null,
    }
  }

  const scoredCases = buildScoredCases(target, options.comparisonDecisions)
  if (scoredCases.length + 1 < minSupportingCount) {
    return {
      status: 'NO_ACTION',
      reason: 'INSUFFICIENT_REAL_CASES',
      candidate: null,
    }
  }

  const supportingCases = selectSupportingCases(scoredCases, threshold)
  if (supportingCases.length + 1 < minSupportingCount) {
    return {
      status: 'NO_ACTION',
      reason: 'INSUFFICIENT_SIMILARITY',
      candidate: null,
    }
  }

  const counterEvidence = selectCounterEvidence(target, scoredCases, threshold)

  return {
    status: 'CANDIDATE_REVIEW',
    reason: 'MULTIPLE_SIMILAR_REAL_CASES',
    candidate: buildCandidate(target, supportingCases.map((scored) => scored.decision), counterEvidence, options.now ?? new Date()),
  }
}
