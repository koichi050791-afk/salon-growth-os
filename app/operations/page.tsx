import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import { getAiOperationsControlCenter } from '@/lib/services/ai-operations'
import type {
  AiOperationStatus,
  ApprovalLevel,
  ApprovalQueueItem,
  AutonomousObservedFact,
  AutonomousOperationFinding,
  AutonomousOperationRun,
  AutonomousOperationStatus,
  DepartmentPatrolOutcome,
  DepartmentPatrolResult,
} from '@/lib/types/ai-operations'

export const metadata: Metadata = {
  title: 'AI Operations | 池田航一｜美容師OS',
  description: 'AI Teamの稼働、監視、レビュー、承認待ちを確認するControl Center',
}

export const runtime = 'nodejs'

const operationStatusLabel: Record<AiOperationStatus, string> = {
  RUNNING: '実行中',
  WATCHING: '監視中',
  REVIEW: 'レビュー',
  APPROVAL: '承認待ち',
}

const autonomousStatusLabel: Record<AutonomousOperationStatus, string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  UNKNOWN: 'UNKNOWN',
  NOT_CHECKED: 'NOT CHECKED',
  UNAVAILABLE: 'UNAVAILABLE',
  NO_ACTION: 'NO ACTION',
}

const patrolOutcomeLabel: Record<DepartmentPatrolOutcome, string> = {
  NO_ACTION: 'NO ACTION',
  AUTO_RESULT: 'AUTO RESULT',
  REVIEW_CANDIDATE: 'REVIEW',
  APPROVAL_REQUIRED: 'APPROVAL',
}

const approvalLabel: Record<ApprovalLevel, string> = {
  AUTO: 'AUTO',
  REVIEW: 'REVIEW',
  APPROVAL: 'APPROVAL',
}

function statusTone(status: AutonomousOperationStatus): string {
  if (status === 'FAIL') return 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
  if (status === 'UNKNOWN' || status === 'NOT_CHECKED' || status === 'UNAVAILABLE') {
    return 'border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]'
  }
  return 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'
}

function outcomeTone(outcome: DepartmentPatrolOutcome): string {
  if (outcome === 'APPROVAL_REQUIRED') {
    return 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
  }
  if (outcome === 'REVIEW_CANDIDATE') {
    return 'border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]'
  }
  return 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'
}

function OperationStatusPill({ status }: { status: AiOperationStatus }) {
  const tone = status === 'APPROVAL'
    ? 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
    : status === 'REVIEW'
      ? 'border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]'
      : 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'

  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-medium ${tone}`}>
      {operationStatusLabel[status]}
    </span>
  )
}

function AutonomousStatusPill({ status }: { status: AutonomousOperationStatus }) {
  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-medium ${statusTone(status)}`}>
      {autonomousStatusLabel[status]}
    </span>
  )
}

function PatrolOutcomePill({ outcome }: { outcome: DepartmentPatrolOutcome }) {
  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-medium ${outcomeTone(outcome)}`}>
      {patrolOutcomeLabel[outcome]}
    </span>
  )
}

function ApprovalPill({ level }: { level: ApprovalLevel }) {
  return (
    <span className="border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">
      {approvalLabel[level]}
    </span>
  )
}

function CountBlock({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-t border-[var(--line)] py-4 pr-3">
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </div>
  )
}

function FactRow({ fact }: { fact: AutonomousObservedFact }) {
  return (
    <article className="border-b border-[var(--line)] py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium leading-6">{fact.label}</h3>
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{fact.value}</p>
        </div>
        <AutonomousStatusPill status={fact.status} />
      </div>
      {fact.evidenceClass ? (
        <p className="mt-2 text-[11px] text-[var(--muted)]">Evidence: {fact.evidenceClass}</p>
      ) : null}
    </article>
  )
}

function FindingRow({ finding }: { finding: AutonomousOperationFinding }) {
  return (
    <article className="border-b border-[var(--line)] py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium leading-6">{finding.title}</h3>
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{finding.summary}</p>
        </div>
        <AutonomousStatusPill status={finding.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
        <span className="border border-[var(--line)] px-2 py-1">{finding.severity}</span>
        <span className="border border-[var(--line)] px-2 py-1">{finding.evidenceClass}</span>
        <span className="border border-[var(--line)] px-2 py-1">{finding.patrolOutcome}</span>
      </div>
    </article>
  )
}

function OperationSummary({ title, run }: { title: string; run: AutonomousOperationRun }) {
  return (
    <QuietPanel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>{run.operationType}</SectionLabel>
          <h2 className="mt-2 text-2xl font-medium">{title}</h2>
        </div>
        <AutonomousStatusPill status={run.status} />
      </div>
      {run.unavailableReason ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{run.unavailableReason}</p>
      ) : null}
    </QuietPanel>
  )
}

function PatrolRow({ result }: { result: DepartmentPatrolResult }) {
  return (
    <article className="border-b border-[var(--line)] py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-[var(--muted)]">{result.domain}</p>
          <h3 className="mt-1 font-medium leading-7">{result.displayName}</h3>
        </div>
        <PatrolOutcomePill outcome={result.outcome} />
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{result.summary}</p>
      {result.proposedAction ? (
        <dl className="mt-4 space-y-2 text-xs leading-6">
          <div>
            <dt className="text-[var(--muted)]">Level</dt>
            <dd className="text-[var(--ink-soft)]">{result.proposedAction.executionLevel}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Reason</dt>
            <dd className="text-[var(--ink-soft)]">{result.proposedAction.reason}</dd>
          </div>
        </dl>
      ) : null}
    </article>
  )
}

function QueueItemRow({ item }: { item: ApprovalQueueItem }) {
  return (
    <article className="border-b border-[var(--line)] py-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-medium leading-7">{item.title}</h3>
        <ApprovalPill level={item.approvalLevel} />
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.summary}</p>
      <dl className="mt-4 space-y-3 text-sm leading-7">
        <div>
          <dt className="text-[11px] text-[var(--muted)]">なぜ見るか</dt>
          <dd className="text-[var(--ink-soft)]">{item.reasonForHuman}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[var(--muted)]">承認すると</dt>
          <dd className="text-[var(--ink-soft)]">{item.proposedAction}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
        <span className="border border-[var(--line)] px-2 py-1">{item.type}</span>
        <span className="border border-[var(--line)] px-2 py-1">{item.risk}</span>
        <span className="border border-[var(--line)] px-2 py-1">{item.reversibility}</span>
        <span className="border border-[var(--line)] px-2 py-1">{item.status}</span>
      </div>
    </article>
  )
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="border-b border-[var(--line)] py-6 text-sm leading-7 text-[var(--muted)]">
      {children}
    </div>
  )
}

function SystemHealthFacts({
  title,
  facts,
}: {
  title: string
  facts: readonly AutonomousObservedFact[]
}) {
  return (
    <div>
      <p className="border-b border-[var(--line)] py-3 text-[11px] font-medium text-[var(--muted)]">
        {title}
      </p>
      {facts.map((fact) => (
        <FactRow key={fact.id} fact={fact} />
      ))}
    </div>
  )
}

export default async function OperationsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const model = await getAiOperationsControlCenter()
  const autonomous = model.autonomousOperations
  const weekly = autonomous.weeklyReview
  const reviewQueueItems = model.approvalQueue.filter((item) => item.approvalLevel === 'REVIEW')
  const approvalQueueItems = model.approvalQueue.filter((item) => item.approvalLevel === 'APPROVAL')
  const patrolReviewCandidates = autonomous.patrolResults.filter((result) =>
    result.outcome === 'REVIEW_CANDIDATE',
  )
  const patrolApprovalRequired = autonomous.patrolResults.filter((result) =>
    result.outcome === 'APPROVAL_REQUIRED',
  )
  const criticalHealthFacts = autonomous.health.observedFacts.filter((fact) =>
    fact.id === 'airtable_decision_adapter',
  )
  const coverageFacts = autonomous.health.observedFacts.filter((fact) =>
    fact.id !== 'airtable_decision_adapter',
  )
  const reviewCount = reviewQueueItems.length + patrolReviewCandidates.length
  const approvalCount = approvalQueueItems.length + patrolApprovalRequired.length

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>AI Operations</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">AI Company Control Center</h1>
          <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--muted)]">
            自律処理の状態、根拠、レビュー対象だけを確認する。
          </p>
        </header>

        <section className="grid grid-cols-2 border-b border-[var(--line)] sm:grid-cols-4">
          <CountBlock label="Today" value={model.todayLabel} />
          <CountBlock label="AI Team" value={`${model.coreAgents.length} Core`} />
          <CountBlock label="Review" value={`${reviewCount}件`} />
          <CountBlock label="Approval" value={`${approvalCount}件`} />
        </section>

        <OperationSummary title="System Health" run={autonomous.health} />

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>System Health</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">確認状態</h2>
          </div>
          <div>
            <SystemHealthFacts title="Critical path" facts={criticalHealthFacts} />
            <SystemHealthFacts title="Coverage" facts={coverageFacts} />
          </div>
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Data Quality</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">{autonomous.dataQuality.findings.length}件</h2>
          </div>
          {autonomous.dataQuality.findings.length === 0 ? (
            <EmptyState>Data Qualityの指摘はありません。</EmptyState>
          ) : (
            <div>
              {autonomous.dataQuality.findings.map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Patrol Results</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">部門別</h2>
          </div>
          <div>
            {autonomous.patrolResults.map((result) => (
              <PatrolRow key={result.domain} result={result} />
            ))}
          </div>
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Review Queue</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">{reviewCount}件</h2>
          </div>
          {reviewCount === 0 ? (
            <EmptyState>レビュー候補はありません。AUTO作業はここに出しません。</EmptyState>
          ) : (
            <div>
              {reviewQueueItems.map((item) => (
                <QueueItemRow key={item.id} item={item} />
              ))}
              {patrolReviewCandidates.map((result) => (
                <PatrolRow key={`review-${result.domain}`} result={result} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Approval Required</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">{approvalCount}件</h2>
          </div>
          {approvalCount === 0 ? (
            <EmptyState>明示承認が必要な操作はありません。</EmptyState>
          ) : (
            <div>
              {approvalQueueItems.map((item) => (
                <QueueItemRow key={item.id} item={item} />
              ))}
              {patrolApprovalRequired.map((result) => (
                <PatrolRow key={`approval-${result.domain}`} result={result} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Weekly Review</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">今週の運用投影</h2>
          </div>
          <div className="grid grid-cols-2 border-b border-[var(--line)] sm:grid-cols-4">
            <CountBlock label="Health Issues" value={weekly.healthIssueCount} />
            <CountBlock label="Data Quality" value={weekly.dataQualityFindingCount} />
            <CountBlock label="Auto Observed" value={weekly.automaticObservationCount} />
            <CountBlock label="NO ACTION" value={weekly.noActionCount} />
            <CountBlock label="Review" value={weekly.reviewCandidateCount} />
            <CountBlock label="Approval" value={weekly.approvalRequiredCount} />
            <CountBlock label="Unresolved" value={weekly.unresolvedOrStaleCount} />
            <CountBlock label="Unknown" value={weekly.unknownCoverageCount} />
          </div>
          <div>
            {weekly.sourceCoverageSummary.map((fact) => (
              <FactRow key={fact.id} fact={fact} />
            ))}
          </div>
        </section>

        <QuietPanel>
          <SectionLabel>Scheduler Boundary</SectionLabel>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {autonomous.schedulerBoundary.note}
          </p>
        </QuietPanel>

        <QuietPanel>
          <SectionLabel>Orchestrator</SectionLabel>
          <h2 className="mt-3 text-2xl font-medium">{model.orchestrator.displayName}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Core Agentではなく、池田の入力を受け取り、必要なAgentとShared Capabilityへ振り分ける司令塔。
          </p>
        </QuietPanel>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Operations</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">運用定義</h2>
          </div>
          <div>
            {model.operations.map((operation) => (
              <article key={operation.id} className="border-b border-[var(--line)] py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium leading-7">{operation.displayName}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{operation.trigger}</p>
                  </div>
                  <OperationStatusPill status={operation.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{operation.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ApprovalPill level={operation.approvalLevel} />
                  {operation.ownerAgentIds.map((agentId) => (
                    <span key={agentId} className="border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">
                      {model.coreAgents.find((agent) => agent.id === agentId)?.displayName}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-2 text-xs leading-6 text-[var(--muted)]">
          {model.boundaryNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      </EditorialPage>
    </AuthGuard>
  )
}
