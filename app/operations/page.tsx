import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import { getAiOperationsControlCenter } from '@/lib/services/ai-operations'
import type { AiOperationStatus, ApprovalLevel } from '@/lib/types/ai-operations'

export const metadata: Metadata = {
  title: 'AI Operations | 池田航一｜美容師OS',
  description: 'AI Teamの稼働、監視、レビュー、承認待ちを確認するControl Center',
}

const statusLabel: Record<AiOperationStatus, string> = {
  RUNNING: '実行中',
  WATCHING: '監視中',
  REVIEW: 'レビュー',
  APPROVAL: '承認待ち',
}

const approvalLabel: Record<ApprovalLevel, string> = {
  AUTO: 'AUTO',
  REVIEW: 'REVIEW',
  APPROVAL: 'APPROVAL',
}

function StatusPill({ status }: { status: AiOperationStatus }) {
  const tone = status === 'APPROVAL'
    ? 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
    : status === 'REVIEW'
      ? 'border-[var(--gold)]/30 bg-[var(--gold-soft)] text-[var(--gold)]'
      : 'border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]'

  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[10px] font-medium ${tone}`}>
      {statusLabel[status]}
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

export default async function OperationsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const model = getAiOperationsControlCenter()
  const approvalCount = model.approvalQueue.length

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>AI Operations</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">AI Company Control Center</h1>
          <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--muted)]">
            予定一覧ではなく、AIが何を見ていて、何がレビュー・承認待ちかを確認する場所。
          </p>
        </header>

        <section className="grid grid-cols-3 border-y border-[var(--line)] text-sm">
          <div className="py-4 pr-3">
            <p className="text-[11px] text-[var(--muted)]">Today</p>
            <p className="mt-2 font-medium">{model.todayLabel}</p>
          </div>
          <div className="border-l border-[var(--line)] px-3 py-4">
            <p className="text-[11px] text-[var(--muted)]">AI Team</p>
            <p className="mt-2 font-medium">{model.coreAgents.length} Core</p>
          </div>
          <div className="border-l border-[var(--line)] py-4 pl-3">
            <p className="text-[11px] text-[var(--muted)]">Approval Queue</p>
            <p className="mt-2 font-medium">{approvalCount}件</p>
          </div>
        </section>

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
            <h2 className="mt-2 text-2xl font-medium">稼働する3つの運用</h2>
          </div>
          <div>
            {model.operations.map((operation) => (
              <article key={operation.id} className="border-b border-[var(--line)] py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium leading-7">{operation.displayName}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{operation.trigger}</p>
                  </div>
                  <StatusPill status={operation.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{operation.summary}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Last result</dt>
                    <dd className="mt-1 leading-7 text-[var(--ink-soft)]">
                      {operation.lastResult ?? 'Run History未接続'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Next action</dt>
                    <dd className="mt-1 leading-7 text-[var(--ink-soft)]">{operation.nextAction}</dd>
                  </div>
                </dl>
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

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Approval Queue</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">池田の確認が必要なもの</h2>
          </div>
          {approvalCount === 0 ? (
            <div className="mt-4 border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
              現時点で承認待ちはありません。AUTO作業は表示せず、池田の判断で次の行動が変わるものだけをここに出します。
            </div>
          ) : (
            <div>
              {model.approvalQueue.map((item) => (
                <article key={item.id} className="border-b border-[var(--line)] py-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium">{item.title}</h3>
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
                    <div>
                      <dt className="text-[11px] text-[var(--muted)]">Evidence</dt>
                      <dd className="text-[var(--ink-soft)]">
                        {item.evidenceRefs.length > 0
                          ? item.evidenceRefs.map((ref) => ref.label).join(' / ')
                          : 'sourceRef未接続'}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
                    <span className="border border-[var(--line)] px-2 py-1">{item.type}</span>
                    <span className="border border-[var(--line)] px-2 py-1">{item.risk}</span>
                    <span className="border border-[var(--line)] px-2 py-1">{item.reversibility}</span>
                    <span className="border border-[var(--line)] px-2 py-1">{item.status}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Agent Registry v0.2</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">4 Core Agents</h2>
          </div>
          <div>
            {model.coreAgents.map((agent) => (
              <article key={agent.id} className="border-b border-[var(--line)] py-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium leading-7">{agent.displayName}</h3>
                  <ApprovalPill level={agent.defaultApprovalLevel} />
                </div>
                <p className="mt-3 text-[11px] text-[var(--muted)]">
                  Events: {agent.acceptedEvents.join(' / ')}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
                  {agent.responsibilities.map((responsibility) => (
                    <li key={responsibility}>{responsibility}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="border-b border-[var(--line)] pb-4">
            <SectionLabel>Shared Capabilities</SectionLabel>
            <h2 className="mt-2 text-2xl font-medium">全Agentにかかる共通能力</h2>
          </div>
          <div>
            {model.sharedCapabilities.map((capability) => (
              <article key={capability.id} className="border-b border-[var(--line)] py-5">
                <h3 className="font-medium leading-7">{capability.displayName}</h3>
                <dl className="mt-3 space-y-3 text-sm leading-7">
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Input</dt>
                    <dd className="text-[var(--ink-soft)]">{capability.inputContract}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Output</dt>
                    <dd className="text-[var(--ink-soft)]">{capability.outputContract}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-[var(--muted)]">Failure</dt>
                    <dd className="text-[var(--ink-soft)]">{capability.failureBehavior}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <QuietPanel>
          <SectionLabel>Work Graph Ready</SectionLabel>
          <div className="mt-4 space-y-4">
            {model.routingPreviews.map((route) => (
              <div key={route.eventType} className="border-b border-[var(--line)] pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{route.eventType}</p>
                  <ApprovalPill level={route.approvalLevel} />
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {route.targetAgentIds.length} Core AgentへsourceRefsのままrouting。canonical dataは複製しない。
                </p>
              </div>
            ))}
          </div>
        </QuietPanel>

        <section className="space-y-2 text-xs leading-6 text-[var(--muted)]">
          {model.boundaryNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      </EditorialPage>
    </AuthGuard>
  )
}
