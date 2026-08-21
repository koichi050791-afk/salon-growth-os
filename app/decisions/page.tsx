import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, SectionLabel } from '@/lib/components/EditorialPage'
import { listAirtableDecisionRecords } from '@/lib/repositories/airtable-decisions'
import { getServerUser } from '@/lib/auth/server-user'
import { shouldShowDecisionInHistory } from '@/lib/services/decision-history-visibility'
import type { DecisionValidationState } from '@/lib/types/decision-validation'
import { DecisionValidationForm } from './DecisionValidationForm'

export const metadata: Metadata = {
  title: 'Decision | 池田航一｜美容師OS',
  description: '現場で残したDecisionの時間軸',
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

const VALIDATION_LABELS: Record<DecisionValidationState, string> = {
  UNVALIDATED: '検証待ち',
  CONFIRMED: '概ね確認済み',
  PARTIAL: '一部確認済み',
  CONTRADICTED: '見直しが必要',
  INCONCLUSIVE: '今回は判断不能',
}

export default async function DecisionsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const result = await listAirtableDecisionRecords(30)
  const decisions = result.data.filter(shouldShowDecisionInHistory)

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
                  <p className="text-xs text-[var(--muted)]">{decision.title || 'Decision記録'}</p>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {decision.status && (
                      <span className="border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
                        {decision.status}
                      </span>
                    )}
                    {decision.dataKind === 'REAL' && decision.values.nextObservation && (
                      <span className="border border-[var(--line)] px-2.5 py-1 text-[10px] text-[var(--muted)]">
                        {VALIDATION_LABELS[decision.validation.validationState]}
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
                  {decision.validation.validationState !== 'UNVALIDATED' && (
                    <div className="space-y-4 border-t border-[var(--line)] pt-4">
                      <ValueBlock
                        label="次回来店で確認できたこと"
                        value={decision.validation.outcomeObserved}
                        accent
                      />
                      <ValueBlock
                        label="検証メモ"
                        value={decision.validation.validationNote}
                      />
                    </div>
                  )}
                  {decision.dataKind === 'REAL'
                    && decision.values.nextObservation
                    && decision.validation.validationState === 'UNVALIDATED' && (
                    <DecisionValidationForm decisionId={decision.id} />
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
