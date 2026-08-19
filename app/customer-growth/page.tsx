import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { EditorialPage, QuietPanel, SectionLabel } from '@/lib/components/EditorialPage'
import { getServerUser } from '@/lib/auth/server-user'
import {
  CUSTOMER_STATES,
  isOperationalCustomer,
  listCustomerGrowthRecords,
  type CustomerGrowthRecord,
  type CustomerState,
  type NextPlanStatus,
} from '@/lib/repositories/airtable-customer-growth'

export const metadata: Metadata = {
  title: 'Customer Growth | 池田航一｜美容師OS',
  description: '既存客維持・失客予防・新規定着を時間軸で観測するCustomer Growth Layer',
}

const stateLabel: Record<CustomerState, string> = {
  NEW: 'NEW',
  DEVELOP: 'DEVELOP',
  CORE: 'CORE',
  WATCH: 'WATCH',
  DORMANT: 'DORMANT',
}

const planLabel: Record<NextPlanStatus, string> = {
  BOOKED: '次回予約あり',
  PLANNED: '次の計画あり',
  NONE: '次の計画なし',
}

function tokyoDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

function dateOnly(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? null
}

function dayDiff(later: string, earlier: string): number {
  const laterMs = Date.parse(`${later}T00:00:00Z`)
  const earlierMs = Date.parse(`${earlier}T00:00:00Z`)
  if (!Number.isFinite(laterMs) || !Number.isFinite(earlierMs)) return 0
  return Math.round((laterMs - earlierMs) / 86_400_000)
}

type ObservationCandidate = {
  customer: CustomerGrowthRecord
  expected: string | null
  overdueDays: number | null
  reason: 'WATCH' | 'EXPECTED_RETURN_OVERDUE'
}

function observationCandidate(customer: CustomerGrowthRecord, today: string): ObservationCandidate | null {
  const expected = dateOnly(customer.expectedReturnDate)
  const overdueDays = expected ? Math.max(0, dayDiff(today, expected)) : null

  if (customer.state === 'WATCH') {
    return { customer, expected, overdueDays, reason: 'WATCH' }
  }

  if (!expected) return null
  if (customer.state === 'DORMANT') return null
  if (customer.nextPlanStatus === 'BOOKED') return null
  if (!overdueDays) return null

  return { customer, expected, overdueDays, reason: 'EXPECTED_RETURN_OVERDUE' }
}

export default async function CustomerGrowthPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const result = await listCustomerGrowthRecords()
  const customers = result.data.filter(isOperationalCustomer)
  const today = tokyoDateString()

  const counts = Object.fromEntries(
    CUSTOMER_STATES.map((state) => [state, customers.filter((customer) => customer.state === state).length]),
  ) as Record<CustomerState, number>

  const unclassified = customers.filter((customer) => !customer.state).length
  const observationCandidates = customers
    .map((customer) => observationCandidate(customer, today))
    .filter((candidate): candidate is ObservationCandidate => candidate !== null)
    .sort((a, b) => {
      if (a.reason !== b.reason) return a.reason === 'WATCH' ? -1 : 1
      return (b.overdueDays ?? -1) - (a.overdueDays ?? -1)
    })
    .slice(0, 12)

  return (
    <AuthGuard>
      <EditorialPage containerClassName="space-y-8">
        <header className="border-b border-[var(--line)] pb-5">
          <SectionLabel>Customer Growth</SectionLabel>
          <h1 className="mt-2 text-[34px] font-medium leading-tight">Customer Growth Layer</h1>
          <p className="mt-3 max-w-[36rem] text-sm leading-7 text-[var(--muted)]">
            今月の売上ではなく、来月以降も売上を生む顧客基盤が強くなっているかを観測する。
          </p>
        </header>

        <QuietPanel>
          <SectionLabel>Principle</SectionLabel>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Customer Stateは顧客ランクではありません。WATCHも営業LINE送信リストではなく、予定した時間軸からズレ始めた時に「何が起きているかを見る」ための状態です。
          </p>
        </QuietPanel>

        {result.error ? (
          <section className="border border-[var(--danger)]/25 bg-[var(--danger)]/10 p-5 text-sm leading-7 text-[var(--danger)]">
            AirtableからCustomer情報を読み込めませんでした。Decision記録には影響ありません。
          </section>
        ) : customers.length === 0 ? (
          <section className="border-y border-[var(--line)] bg-[var(--paper-soft)] px-4 py-7">
            <SectionLabel>Phase 0</SectionLabel>
            <h2 className="mt-3 text-xl font-medium">実顧客の時間軸を接続する段階</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              現在はSampleデータを集計から除外しています。実顧客のCustomer → Visit → Decision接続が始まると、ここに状態と確認候補が表示されます。
            </p>
          </section>
        ) : (
          <>
            <section>
              <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
                <div>
                  <SectionLabel>Customer Base</SectionLabel>
                  <h2 className="mt-2 text-2xl font-medium">現在の状態</h2>
                </div>
                <p className="text-xs text-[var(--muted)]">実顧客 {customers.length}人</p>
              </div>
              <div className="grid grid-cols-2 border-b border-[var(--line)] sm:grid-cols-3">
                {CUSTOMER_STATES.map((state) => (
                  <div key={state} className="border-t border-[var(--line)] py-4 pr-3">
                    <p className="text-[11px] text-[var(--muted)]">{stateLabel[state]}</p>
                    <p className="mt-1 text-2xl font-medium">{counts[state]}</p>
                  </div>
                ))}
                <div className="border-t border-[var(--line)] py-4 pr-3">
                  <p className="text-[11px] text-[var(--muted)]">未分類</p>
                  <p className="mt-1 text-2xl font-medium">{unclassified}</p>
                </div>
              </div>
            </section>

            <section>
              <div className="border-b border-[var(--line)] pb-4">
                <SectionLabel>Today&apos;s Observation</SectionLabel>
                <h2 className="mt-2 text-2xl font-medium">今、見る候補</h2>
                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                  WATCH状態、またはExpected Returnを超過して次回予約がない顧客。自動連絡はしません。
                </p>
              </div>

              {observationCandidates.length === 0 ? (
                <div className="mt-4 border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm text-[var(--muted)]">
                  現時点で確認候補はありません。
                </div>
              ) : (
                <div>
                  {observationCandidates.map(({ customer, expected, overdueDays, reason }) => (
                    <article key={customer.id} className="border-b border-[var(--line)] py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.customerId && (
                            <p className="mt-1 text-[11px] text-[var(--muted)]">{customer.customerId}</p>
                          )}
                        </div>
                        <span className="border border-[var(--gold)]/30 bg-[var(--gold-soft)] px-2.5 py-1 text-[10px] font-medium text-[var(--gold)]">
                          {reason === 'WATCH' ? 'WATCH' : 'WATCH候補'}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-[var(--muted)]">Expected Return</dt>
                          <dd className="mt-1 text-[var(--ink-soft)]">{expected ?? '未設定'}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--muted)]">超過</dt>
                          <dd className="mt-1 font-medium text-[var(--ink-soft)]">
                            {overdueDays && overdueDays > 0 ? `${overdueDays}日` : '—'}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-4 text-xs text-[var(--muted)]">
                        Next Plan：{customer.nextPlanStatus ? planLabel[customer.nextPlanStatus] : '未確認'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <QuietPanel>
          <SectionLabel>Not Automated</SectionLabel>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            State変更、失客確定、連絡判断、施術提案は自動化しません。30〜60日の実データを見て、池田の場合に成立する条件を先に発見します。
          </p>
        </QuietPanel>
      </EditorialPage>
    </AuthGuard>
  )
}
