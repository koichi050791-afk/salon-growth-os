import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import { getAirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'
import OutcomeValidationForm from './OutcomeValidationForm'

export const metadata: Metadata = {
  title: 'Outcome | 池田航一｜美容師OS',
  description: '前回DecisionのOutcomeとValidationを軽く記録する',
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

export default async function DecisionOutcomePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const { id } = await params
  const result = await getAirtableDecisionRecord(id)
  if (result.error === 'not_found') notFound()

  const decision = result.data

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-7 pb-8">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--line)] pb-5">
          <div>
            <SectionLabel>Decision Loop</SectionLabel>
            <h1 className="mt-2 text-[34px] font-medium leading-tight">Outcome</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              前回Decisionがどうだったかだけを軽く閉じる。
            </p>
          </div>
          <Link
            href="/decisions"
            className="min-h-[44px] shrink-0 border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-xs text-[var(--muted)]"
          >
            戻る
          </Link>
        </header>

        {result.error ? (
          <section className="border border-[var(--danger)]/25 bg-[var(--danger)]/10 p-5 text-sm leading-7 text-[var(--danger)]">
            AirtableからDecisionを読み込めませんでした。
          </section>
        ) : decision ? (
          <>
            <QuietPanel>
              <SectionLabel>Previous Decision</SectionLabel>
              <div className="mt-4 space-y-4">
                <p className="text-xs text-[var(--muted)]">{decision.title || 'Decision記録'}</p>
                <ValueBlock label="前回の相談" value={decision.values.consultationConcern} />
                <ValueBlock label="前回の判断" value={decision.values.chosenDecision} accent />
                <ValueBlock label="今回確認" value={decision.values.nextObservation} accent />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 text-xs">
                <div>
                  <p className="text-[var(--muted)]">Customer</p>
                  <p className="mt-1 text-[var(--ink-soft)]">{decision.customerId ? '接続済み' : '未接続'}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Visit</p>
                  <p className="mt-1 text-[var(--ink-soft)]">{decision.visitId ? '接続済み' : '未接続'}</p>
                </div>
              </div>
            </QuietPanel>

            {decision.validation ? (
              <section className="border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
                このDecisionはValidation記録済みです。必要な場合だけ上書きしてください。
              </section>
            ) : null}

            <OutcomeValidationForm decisionId={decision.id} />
          </>
        ) : null}
      </EditorialPage>
    </AuthGuard>
  )
}
