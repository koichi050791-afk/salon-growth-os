import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { listAirtableDecisionRecords, type AirtableDecisionRecord } from '@/lib/repositories/airtable-decisions'
import { getServerUser } from '@/lib/auth/server-user'
import { isRealDataKind } from '@/lib/types/data-kind'

const TEST_PREFIXES = ['【TEST】', '【VERCEL TEST】', '【PRODUCTION TEST】']

function isTestDecision(decision: AirtableDecisionRecord) {
  const consultation = decision.values.consultationConcern ?? ''
  return TEST_PREFIXES.some((prefix) => consultation.startsWith(prefix))
}

function isOperationalDecision(decision: AirtableDecisionRecord) {
  return isRealDataKind(decision.dataKind) && !isTestDecision(decision)
}

function shortText(value: string | null, fallback: string) {
  if (!value) return fallback
  return value.length > 72 ? `${value.slice(0, 72)}…` : value
}

export default async function Home() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const recentResult = await listAirtableDecisionRecords(10)
  const recent = {
    ...recentResult,
    data: recentResult.data.filter(isOperationalDecision).slice(0, 3),
  }

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-9">
        <header className="space-y-5 pt-1">
          <div className="flex items-center justify-between gap-4">
            <SectionLabel>Ikeda Personal OS</SectionLabel>
            <span className="border border-[var(--line)] px-3 py-1.5 text-[11px] text-[var(--muted)]">
              ホップ
            </span>
          </div>
          <div>
            <h1 className="text-[34px] font-medium leading-[1.24] sm:text-5xl">
              池田航一｜美容師OS
            </h1>
            <p className="mt-4 max-w-[32rem] text-[15px] leading-8 text-[var(--muted)]">
              サロンワークの判断を短く残し、次に見ることへつなげる。
            </p>
          </div>
        </header>

        <QuietPanel className="py-6">
          <SectionLabel>Primary Action</SectionLabel>
          <h2 className="mt-3 text-[26px] font-medium leading-snug">Decisionを3分以内で残す</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            相談、事実、判断、しなかったこと、次回確認だけを残す。
          </p>
          <Link
            href="/decision-input"
            className="mt-6 flex min-h-[58px] w-full items-center justify-between bg-[var(--charcoal)] px-5 text-base font-medium text-[var(--paper-soft)] transition active:scale-[0.99]"
          >
            <span>記録を開く</span>
            <span aria-hidden="true">→</span>
          </Link>
        </QuietPanel>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="border-t border-[var(--line)] pt-4">
            <SectionLabel>Current Phase</SectionLabel>
            <p className="mt-3 text-xl font-medium">ホップ</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              観察・記録・小さな実験・勝ち筋の発見
            </p>
          </div>
          <Link href="/project" className="border-t border-[var(--line)] pt-4 transition active:scale-[0.99]">
            <SectionLabel>Goal</SectionLabel>
            <p className="mt-3 text-xl font-medium">月間技術売上130万円</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              9:00〜18:00と家族時間を守って安定達成
            </p>
          </Link>
        </section>

        <Link
          href="/customer-growth"
          className="group flex items-center justify-between gap-5 border-y border-[var(--line)] py-5 transition active:scale-[0.99]"
        >
          <div>
            <SectionLabel>Customer Growth</SectionLabel>
            <h2 className="mt-3 text-xl font-medium">顧客基盤の状態を見る</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              NEW・DEVELOP・CORE・WATCHを時間軸で観測する。
            </p>
          </div>
          <span className="shrink-0 text-xl text-[var(--gold)] transition group-active:translate-x-1" aria-hidden="true">
            →
          </span>
        </Link>

        <section>
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
            <div>
              <SectionLabel>Learning Stream</SectionLabel>
              <h2 className="mt-2 text-2xl font-medium">直近のDecision</h2>
            </div>
            <Link href="/decisions" className="min-h-[44px] px-1 py-3 text-sm text-[var(--gold)]">
              すべて見る →
            </Link>
          </div>

          {recent.error ? (
            <div className="mt-5 border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
              Decisionを読み込めませんでした。記録機能には影響ありません。
            </div>
          ) : recent.data.length === 0 ? (
            <div className="mt-5 border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
              まだDecisionがありません。最初の1件を残してください。
            </div>
          ) : (
            <div>
              {recent.data.map((decision) => (
                <article key={decision.id} className="border-b border-[var(--line)] py-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-[var(--muted)]">{decision.title || 'Decision記録'}</p>
                    {decision.status && (
                      <span className="shrink-0 border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">
                        {decision.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-base font-medium leading-7">
                    {shortText(decision.values.consultationConcern, '相談未入力')}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] text-[var(--muted)]">今回の判断</p>
                      <p className="mt-1 leading-7 text-[var(--ink-soft)]">
                        {shortText(decision.values.chosenDecision, '未入力')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[var(--muted)]">次回確認</p>
                      <p className="mt-1 leading-7 text-[var(--ink-soft)]">
                        {shortText(decision.values.nextObservation, '未入力')}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <QuietPanel>
          <SectionLabel>Principle</SectionLabel>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            何をするかより先に、何が必要かを判断する。事実と仮説を分け、選んだことだけでなく、しなかったことと次回観察を残す。
          </p>
        </QuietPanel>
      </EditorialPage>
    </AuthGuard>
  )
}
