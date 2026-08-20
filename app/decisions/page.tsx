import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, SectionLabel } from '@/lib/components/EditorialPage'
import { listAirtableDecisionRecords, type AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'
import { getServerUser } from '@/lib/auth/server-user'

export const metadata: Metadata = {
  title: 'Decision | 池田航一｜美容師OS',
  description: '現場で残したDecisionの時間軸',
}

const TEST_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']

function isTestDecision(decision: AirtableDecisionRecord) {
  const consultation = decision.values.consultationConcern ?? ''
  return TEST_PREFIXES.some((prefix) => consultation.startsWith(prefix))
}

function ValueBlock({ label, value, accent = false }: { label: string; value: string | null; accent?: boolean }) {
  if (!value) return null

  return (
    <div className={accent ? 'border-l-2 border-[var(--gold)] pl-3' : ''}>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-[var(--ink-soft)]">{value}</p>
    </div>
  )
}

function loopStatus(decision: AirtableDecisionRecord): string {
  if (decision.validation) return 'Validated'
  if (decision.outcome) return 'Outcome Captured'
  if (decision.values.nextObservation) return 'Awaiting Observation'
  return 'No Next Observation'
}

export default async function DecisionsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const result = await listAirtableDecisionRecords(30)
  const decisions = result.data.filter((decision) => !isTestDecision(decision))

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-7">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--line)] pb-5">
          <div>
            <SectionLabel>Learning Stream</SectionLabel>
            <h1 className="mt-2 text-[34px] font-medium leading-tight">Decision</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              何を選び、何を選ばず、次に何を見るかの時間軸。
            </p>
          </div>
          <Link
            href="/decision-input"
            className="min-h-[44px] shrink-0 bg-[var(--charcoal)] px-4 py-3 text-sm font-medium text-[var(--paper-soft)]"
          >
            ＋ 記録
          </Link>
        </header>

        {result.error ? (
          <div className="border border-[var(--danger)]/25 bg-[var(--danger)]/10 p-4 text-sm leading-7 text-[var(--danger)]">
            AirtableからDecisionを読み込めませんでした。記録機能には影響ありません。
          </div>
        ) : decisions.length === 0 ? (
          <div className="border-y border-[var(--line)] bg-[var(--paper-soft)] px-4 py-8 text-center">
            <p className="text-sm text-[var(--muted)]">実運用のDecisionはまだありません。</p>
            <Link
              href="/decision-input"
              className="mt-5 inline-flex min-h-[44px] items-center bg-[var(--charcoal)] px-5 py-3 text-sm font-medium text-[var(--paper-soft)]"
            >
              最初のDecisionを残す
            </Link>
          </div>
        ) : (
          <div>
            {decisions.map((decision) => (
              <article key={decision.id} className="border-b border-[var(--line)] py-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted)]">{decision.title || 'Decision記録'}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      Customer {decision.customerId ? '接続済み' : '未接続'} / Visit {decision.visitId ? '接続済み' : '未接続'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="shrink-0 border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
                      {loopStatus(decision)}
                    </span>
                    {decision.status && (
                      <span className="shrink-0 border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
                        {decision.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-5">
                  <ValueBlock label="相談" value={decision.values.consultationConcern} />
                  <ValueBlock label="今回の判断" value={decision.values.chosenDecision} accent />
                  <ValueBlock label="次回確認" value={decision.values.nextObservation} accent />
                  <div className="grid gap-4 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
                    <ValueBlock label="確認した事実" value={decision.values.customerTruth} />
                    <ValueBlock label="あえてしなかったこと" value={decision.values.notChosen} />
                  </div>
                  {decision.outcome && (
                    <div className="border-t border-[var(--line)] pt-4">
                      <ValueBlock label="Outcome" value={decision.outcome.observation} />
                      <ValueBlock label="Validation" value={decision.validation?.result ?? null} accent />
                    </div>
                  )}
                  {decision.values.nextObservation && !decision.validation && (
                    <Link
                      href={`/decisions/${decision.id}/outcome`}
                      className="inline-flex min-h-[44px] items-center border border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-sm font-medium text-[var(--ink-soft)]"
                    >
                      Outcomeを記録
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </EditorialPage>
    </AuthGuard>
  )
}
