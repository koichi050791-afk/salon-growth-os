import type { AirtableDecisionCoreValues } from '@/lib/repositories/airtable-decisions'
import type {
  ApprovalLevel,
  ApprovalReversibility,
  ApprovalRisk,
  CandidateWorkGraphEvent,
  EvidenceRef,
} from '@/lib/types/ai-operations'

export type KnowledgeRelationType =
  | 'reinforce'
  | 'contradict'
  | 'extend'
  | 'insufficient_evidence'

export type KnowledgeProposal = {
  id: string
  relationType: KnowledgeRelationType
  relatedKnowledgeId: string | null
  title: string
  summary: string
  reasonForHuman: string
  proposedAction: string
  missingObservations: readonly string[]
  evidenceRefs: readonly EvidenceRef[]
  approvalLevel: Extract<ApprovalLevel, 'REVIEW' | 'APPROVAL'>
  risk: ApprovalRisk
  reversibility: ApprovalReversibility
}

type DetectKnowledgeProposalsInput = {
  decisionRecordId: string | null
  decisionTitle: string
  values: AirtableDecisionCoreValues
  sourceRef: EvidenceRef
  occurredAt?: Date
}

function stableHash(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function normalizedDecisionText(values: AirtableDecisionCoreValues): string {
  return [
    values.consultationConcern,
    values.customerTruth,
    values.chosenDecision,
    values.notChosen,
    values.nextObservation,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term.toLowerCase()))
}

function proposalEvidenceRef(id: string, label: string, observedAt: string): EvidenceRef {
  return {
    id,
    source: 'internal',
    label,
    observedAt,
  }
}

function buildProposal(
  input: DetectKnowledgeProposalsInput,
  proposal: Omit<KnowledgeProposal, 'id' | 'evidenceRefs'> & { evidenceRefs?: readonly EvidenceRef[] },
): KnowledgeProposal {
  const occurredAt = (input.occurredAt ?? new Date()).toISOString()
  return {
    ...proposal,
    id: `knowledge_proposal_${stableHash(`${input.decisionRecordId ?? input.decisionTitle}:${proposal.title}`)}`,
    evidenceRefs: proposal.evidenceRefs ?? [input.sourceRef],
  }
}

export function detectKnowledgeProposals(
  input: DetectKnowledgeProposalsInput,
): readonly KnowledgeProposal[] {
  const text = normalizedDecisionText(input.values)
  const occurredAt = (input.occurredAt ?? new Date()).toISOString()
  const proposals: KnowledgeProposal[] = []

  const changeAmountPattern =
    hasAny(text, ['短くしたい', '変化量', '段階的', '一気に短く'])
    && hasAny(text, ['失敗', '不安', '段階', '小さめ', '3回'])

  if (changeAmountPattern) {
    proposals.push(buildProposal(input, {
      relationType: 'insufficient_evidence',
      relatedKnowledgeId: null,
      title: '「変化量設計」をKnowledge候補として観測する',
      summary: '髪型そのものだけでなく、今回どこまで変えるかを設計するDecisionパターンが検出されました。',
      reasonForHuman: '単一Decisionから一般化せず、類似Caseで成立条件と不成立条件を確認する必要があります。',
      proposedAction: '類似Caseを2〜3件観測し、満足・扱いやすさ・次段階への希望を比較する。',
      missingObservations: [
        '類似Caseで同じ判断が成立するか',
        '次回来店時の扱いやすさ',
        '段階的変化が適さなかった反例',
      ],
      approvalLevel: 'REVIEW',
      risk: 'LOW',
      reversibility: 'REVERSIBLE',
      evidenceRefs: [input.sourceRef],
    }))
  }

  const layerPattern = hasAny(text, ['レイヤー'])
    && hasAny(text, ['毛量少', '厚み', '入れない', '量を抑', '再現性', '流行'])

  if (layerPattern) {
    proposals.push(buildProposal(input, {
      relationType: 'reinforce',
      relatedKnowledgeId: 'K-0003',
      title: 'K-0003「レイヤーは全員に必要ではない」を検証継続',
      summary: '流行ではなく毛量・毛先の厚み・再現性でレイヤー量を判断するDecisionが検出されました。',
      reasonForHuman: '次回来店Outcomeが未確認のため、Knowledgeを確立へ昇格させる段階ではありません。',
      proposedAction: '次回来店で毛先の厚み・扱いやすさ・本人の満足を確認し、K-0003の成立条件を更新する。',
      missingObservations: [
        '次回来店時の扱いやすさ',
        '毛先の厚みの維持',
        '本人の満足',
      ],
      approvalLevel: 'REVIEW',
      risk: 'LOW',
      reversibility: 'REVERSIBLE',
      evidenceRefs: [
        input.sourceRef,
        proposalEvidenceRef('knowledge_k0003', 'Knowledge K-0003', occurredAt),
      ],
    }))
  }

  const lightnessPattern = hasAny(text, ['軽くしたい', '軽く見', '重く見'])
    && hasAny(text, ['ハイライト', '顔まわり', 'レイヤー', '梳', '毛量調整'])

  if (lightnessPattern) {
    proposals.push(buildProposal(input, {
      relationType: 'extend',
      relatedKnowledgeId: 'K-0001',
      title: 'K-0001を「軽さの複合設計」へ拡張する可能性',
      summary: '軽さを毛量だけでなく、形・レイヤー・色の明るさを組み合わせて作るDecisionが検出されました。',
      reasonForHuman: '「軽くしたい＝量を減らさない」という単純ルールへ寄せると今回のDecisionを説明できないため、既存Knowledgeの適用条件を再検討する価値があります。',
      proposedAction: '既存Knowledgeは上書きせず、全体を梳く判断が成立した条件と次回来店Outcomeを確認してから、K-0001の反証か適用条件追加かを判定する。',
      missingObservations: [
        '全体を梳く判断が安全だった髪の条件',
        '毛先の厚み',
        'クセ・広がりとの関係',
        '次回来店時の扱いやすさ',
      ],
      approvalLevel: 'APPROVAL',
      risk: 'MEDIUM',
      reversibility: 'REVERSIBLE',
      evidenceRefs: [
        input.sourceRef,
        proposalEvidenceRef('knowledge_k0001', 'Knowledge K-0001', occurredAt),
      ],
    }))
  }

  return proposals
}

export function buildKnowledgeCandidateEvent(
  proposal: KnowledgeProposal,
  occurredAt = new Date(),
): CandidateWorkGraphEvent {
  return {
    id: `event_KnowledgeCandidateDetected_${stableHash(proposal.id)}`,
    type: 'KnowledgeCandidateDetected',
    occurredAt: occurredAt.toISOString(),
    source: 'internal',
    sourceRefs: proposal.evidenceRefs,
    payload: {
      title: proposal.title,
      summary: `[${proposal.relationType}] ${proposal.summary}`,
      reasonForHuman: `${proposal.reasonForHuman} Missing: ${proposal.missingObservations.join(' / ')}`,
      proposedAction: proposal.proposedAction,
      evidenceRefs: proposal.evidenceRefs,
      risk: proposal.risk,
      reversibility: proposal.reversibility,
    },
  }
}
