import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
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
      <main className="min-h-dvh bg-[#0B1220] pb-24 text-[#E6ECF5]">
        <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-6">
          <header>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">CUSTOMER GROWTH</p>
            <h1 className="mt-2 text-2xl font-bold">Customer Growth Layer</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8B94A7]">
              今月の売上ではなく、来月以降も売上を生む顧客基盤が強くなっているかを観測する。
            </p>
          </header>

          <section className="rounded-3xl border border-[#D4AF37]/25 bg-[#111A2B] p-5">
            <p className="text-xs font-bold text-[#D4AF37]">v0.2の原則</p>
            <p className="mt-2 text-sm leading-relaxed text-[#C9D1DE]">
              Customer Stateは顧客ランクではありません。WATCHも営業LINE送信リストではなく、予定した時間軸からズレ始めた時に「何が起きているかを見る」ための状態です。
            </p>
          </section>

          {result.error ? (
            <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
              AirtableからCustomer情報を読み込めませんでした。Decision記録には影響ありません。
            </section>
          ) : customers.length === 0 ? (
            <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-5">
              <p className="text-xs text-[#7F8AA0]">Phase 0</p>
              <h2 className="mt-2 text-lg font-bold">実顧客の時間軸を接続する段階</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9AA4B7]">
                現在はSampleデータを集計から除外しています。実顧客のCustomer → Visit → Decision接続が始まると、ここに状態と確認候補が表示されます。
              </p>
            </section>
          ) : (
            <>
              <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#7F8AA0]">Customer Base</p>
                    <h2 className="mt-1 text-lg font-bold">現在の状態</h2>
                  </div>
                  <p className="text-xs text-[#7F8AA0]">実顧客 {customers.length}人</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {CUSTOMER_STATES.map((state) => (
                    <div key={state} className="rounded-2xl border border-white/10 bg-[#0B1220] p-3">
                      <p className="text-[11px] text-[#7F8AA0]">{stateLabel[state]}</p>
                      <p className="mt-1 text-xl font-bold">{counts[state]}</p>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-3">
                    <p className="text-[11px] text-[#7F8AA0]">未分類</p>
                    <p className="mt-1 text-xl font-bold">{unclassified}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
                <div>
                  <p className="text-xs text-[#7F8AA0]">Today&apos;s Observation</p>
                  <h2 className="mt-1 text-lg font-bold">今、見る候補</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#8B94A7]">
                    WATCH状態、またはExpected Returnを超過して次回予約がない顧客。自動連絡はしません。
                  </p>
                </div>

                {observationCandidates.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#0B1220] p-4 text-sm text-[#8B94A7]">
                    現時点で確認候補はありません。
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {observationCandidates.map(({ customer, expected, overdueDays, reason }) => (
                      <article key={customer.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            {customer.customerId && (
                              <p className="mt-1 text-[11px] text-[#667085]">{customer.customerId}</p>
                            )}
                          </div>
                          <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-semibold text-[#D4AF37]">
                            {reason === 'WATCH' ? 'WATCH' : 'WATCH候補'}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-[#111A2B] p-3">
                            <p className="text-[#7F8AA0]">Expected Return</p>
                            <p className="mt-1 text-[#C9D1DE]">{expected ?? '未設定'}</p>
                          </div>
                          <div className="rounded-xl bg-[#111A2B] p-3">
                            <p className="text-[#7F8AA0]">超過</p>
                            <p className="mt-1 font-semibold text-[#C9D1DE]">
                              {overdueDays && overdueDays > 0 ? `${overdueDays}日` : '—'}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-[#8B94A7]">
                          Next Plan：{customer.nextPlanStatus ? planLabel[customer.nextPlanStatus] : '未確認'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          <section className="rounded-3xl border border-white/10 bg-[#111A2B] p-4">
            <p className="text-xs text-[#7F8AA0]">まだ自動化しないこと</p>
            <p className="mt-2 text-sm leading-relaxed text-[#C9D1DE]">
              State変更、失客確定、連絡判断、施術提案は自動化しません。30〜60日の実データを見て、池田の場合に成立する条件を先に発見します。
            </p>
          </section>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
