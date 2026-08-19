import {
  CHATGPT_ORCHESTRATOR,
  CORE_AGENTS,
  SHARED_CAPABILITIES,
  buildWorkGraphRoutingPreview,
} from '@/lib/services/agent-registry'
import { getVisibleApprovalQueueItems } from '@/lib/services/approval-queue'
import type {
  AiOperationDefinition,
  AiOperationsControlCenter,
} from '@/lib/types/ai-operations'

const OPERATIONS: readonly AiOperationDefinition[] = [
  {
    id: 'morning-executive-brief',
    displayName: 'Morning Executive Brief',
    trigger: '毎日 06:00 / Asia/Tokyo',
    status: 'WATCHING',
    summary: '前日までのDecision、顧客観察、KPIのズレを短く束ねる朝の確認。',
    lastResult: null,
    nextAction: 'Run History接続後、最新の要約と未確認事項を表示する。',
    ownerAgentIds: [
      'salon-customer-intelligence',
      'decision-learning-intelligence',
      'growth-market-intelligence',
    ],
    sharedCapabilityIds: ['trigger-scheduler', 'evidence-resolver', 'approval-policy', 'run-history'],
    approvalLevel: 'REVIEW',
  },
  {
    id: 'daily-close',
    displayName: 'Daily Close',
    trigger: '意味のあるサロン入力がある日の終業後',
    status: 'WATCHING',
    summary: 'その日の観察からDecision、Outcome候補、次回確認を閉じる条件ベースの処理。',
    lastResult: null,
    nextAction: 'DecisionCaptured / DailyReportCaptured eventをWork Graphへ接続する。',
    ownerAgentIds: ['salon-customer-intelligence', 'decision-learning-intelligence'],
    sharedCapabilityIds: ['evidence-resolver', 'quality-brand-qa', 'approval-policy', 'run-history'],
    approvalLevel: 'AUTO',
  },
  {
    id: 'weekly-board-review',
    displayName: 'Weekly Board Review',
    trigger: '毎週月曜 朝 / Asia/Tokyo',
    status: 'REVIEW',
    summary: '1週間のDecision、顧客基盤、成長観察、発信/開発候補を比較する。',
    lastResult: null,
    nextAction: 'Approval Queue接続後、レビュー候補だけを池田に返す。',
    ownerAgentIds: [
      'decision-learning-intelligence',
      'growth-market-intelligence',
      'content-product-intelligence',
    ],
    sharedCapabilityIds: ['quality-brand-qa', 'approval-policy', 'evidence-resolver', 'run-history'],
    approvalLevel: 'REVIEW',
  },
]

function formatTokyoToday(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(date)
}

export function getAiOperationsControlCenter(date = new Date()): AiOperationsControlCenter {
  return {
    todayLabel: formatTokyoToday(date),
    orchestrator: CHATGPT_ORCHESTRATOR,
    coreAgents: CORE_AGENTS,
    sharedCapabilities: SHARED_CAPABILITIES,
    operations: OPERATIONS,
    approvalQueue: getVisibleApprovalQueueItems(),
    routingPreviews: [
      buildWorkGraphRoutingPreview('DecisionCaptured'),
      buildWorkGraphRoutingPreview('DailyReportCaptured'),
      buildWorkGraphRoutingPreview('KnowledgeCandidateDetected'),
      buildWorkGraphRoutingPreview('ContentCandidateDetected'),
      buildWorkGraphRoutingPreview('EngineeringCandidateDetected'),
    ],
    boundaryNotes: [
      'ChatGPT is the Chief of Staff / Orchestrator, not a Core Agent.',
      'Shared Capabilities are cross-cutting services, not additional agents.',
      'Airtable remains the customer / visit / Decision / Future Plan source of truth.',
      'No Gmail, Google Calendar, or Airtable agent-management table is required for v0.2.',
    ],
  }
}
