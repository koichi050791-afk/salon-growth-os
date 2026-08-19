import type {
  ApprovalLevel,
  ApprovalQueueItem,
  ApprovalQueueItemType,
  ApprovalQueueStatus,
  ApprovalReversibility,
  ApprovalRisk,
  CoreAgentId,
  EvidenceRef,
  WorkGraphEventRef,
} from '@/lib/types/ai-operations'

export type ApprovalQueueCandidate = {
  idempotencyKey: string
  type: ApprovalQueueItemType
  title: string
  summary: string
  reasonForHuman: string
  evidenceRefs: readonly EvidenceRef[]
  proposedAction: string
  approvalLevel: ApprovalLevel
  risk: ApprovalRisk
  reversibility: ApprovalReversibility
  expiresAt?: string | null
  sourceAgent: CoreAgentId
  sourceEvent: WorkGraphEventRef
  materialHumanDecision: boolean
}

let approvalQueueItems: ApprovalQueueItem[] = []

function stableHash(value: string): string {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function isHumanApprovalLevel(level: ApprovalLevel): level is Extract<ApprovalLevel, 'REVIEW' | 'APPROVAL'> {
  return level === 'REVIEW' || level === 'APPROVAL'
}

function hasMeaningfulText(value: string): boolean {
  return value.trim().length > 0
}

export function shouldCreateApprovalQueueItem(candidate: ApprovalQueueCandidate): boolean {
  return (
    isHumanApprovalLevel(candidate.approvalLevel)
    && candidate.materialHumanDecision
    && hasMeaningfulText(candidate.reasonForHuman)
    && hasMeaningfulText(candidate.proposedAction)
  )
}

export function getApprovalQueueDuplicateKey(item: Pick<
  ApprovalQueueItem,
  'type' | 'sourceAgent' | 'sourceEvent' | 'proposedAction'
>): string {
  return [
    item.type,
    item.sourceAgent,
    item.sourceEvent.type,
    normalizeKeyPart(item.proposedAction),
  ].join(':')
}

function createApprovalQueueItem(
  candidate: ApprovalQueueCandidate,
  createdAt: string,
): ApprovalQueueItem | null {
  if (!shouldCreateApprovalQueueItem(candidate) || !isHumanApprovalLevel(candidate.approvalLevel)) {
    return null
  }

  return {
    id: `approval_${stableHash([
      candidate.sourceEvent.id,
      candidate.sourceAgent,
      candidate.type,
      candidate.idempotencyKey,
    ].join(':'))}`,
    type: candidate.type,
    title: candidate.title,
    summary: candidate.summary,
    reasonForHuman: candidate.reasonForHuman,
    evidenceRefs: candidate.evidenceRefs,
    proposedAction: candidate.proposedAction,
    approvalLevel: candidate.approvalLevel,
    risk: candidate.risk,
    reversibility: candidate.reversibility,
    createdAt,
    expiresAt: candidate.expiresAt ?? null,
    status: 'PENDING',
    sourceAgent: candidate.sourceAgent,
    sourceEvent: candidate.sourceEvent,
  }
}

function isVisibleQueueItem(item: ApprovalQueueItem): boolean {
  return item.status === 'PENDING' && isHumanApprovalLevel(item.approvalLevel)
}

export function getVisibleApprovalQueueItems(): readonly ApprovalQueueItem[] {
  return approvalQueueItems.filter(isVisibleQueueItem)
}

export function enqueueApprovalQueueCandidates(
  candidates: readonly ApprovalQueueCandidate[],
  now = new Date(),
): readonly ApprovalQueueItem[] {
  const createdAt = now.toISOString()
  const enqueuedItems: ApprovalQueueItem[] = []
  const createdItems = candidates
    .map((candidate) => createApprovalQueueItem(candidate, createdAt))
    .filter((item): item is ApprovalQueueItem => item !== null)

  createdItems.forEach((item) => {
    const existingSameId = approvalQueueItems.find((existing) => existing.id === item.id)
    if (existingSameId) {
      if (isVisibleQueueItem(existingSameId)) {
        enqueuedItems.push(existingSameId)
      }
      return
    }

    const duplicateKey = getApprovalQueueDuplicateKey(item)
    approvalQueueItems = approvalQueueItems.map((existing) => {
      if (existing.status !== 'PENDING') return existing
      if (existing.id === item.id) return existing
      if (getApprovalQueueDuplicateKey(existing) !== duplicateKey) return existing

      return { ...existing, status: 'SUPERSEDED' satisfies ApprovalQueueStatus }
    })
    approvalQueueItems = [...approvalQueueItems, item]
    enqueuedItems.push(item)
  })

  return enqueuedItems
}
