import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import {
  getDailyRecordsByMonth,
  aggregateMonthlyRecords,
} from '@/lib/repositories/daily-records'
import { getServerProfile } from '@/lib/repositories/profiles'
import type { MonthlyConfig, DailyRecord } from '@/lib/types/db'
import StoreSelect from './StoreSelect'

type Status = 'good' | 'warning' | 'danger'

function getStatus(actual: number, target: number | null): Status | null {
  if (target === null || target === 0) return null
  const ratio = actual / target
  if (ratio >= 0.9) return 'good'
  if (ratio >= 0.7) return 'warning'
  return 'danger'
}

const STATUS_LABEL: Record<Status, string> = { good: '達成', warning: '注意', danger: '危険' }

const STATUS_BADGE: Record<Status, string> = {
  good:    'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger:  'bg-red-900/50 text-red-400',
}

const STATUS_BAR: Record<Status, string> = {
  good: 'bg-green-400', warning: 'bg-yellow-400', danger: 'bg-red-400',
}

const ACTION_MAP: Record<string, string> = {
  '再来率': '施術中に次回来店時期を必ず口頭で伝える',
  '売上':   'カラー前にケア提案を1回必ず入れる',
  '来店数': '仕上がり直後に口コミ案内をその場で送る',
  '客単価': 'シャンプー時にヘッドスパ案内を全員に行う',
}

type MetricEntry = {
  label: string
  target: number | null
  actual: number | null
  suffix: string
  digits?: number
}

function getWeeklyAction(metrics: MetricEntry[]): { label: string; action: string } | null {
  const dangerous = metrics
    .filter((m) => m.actual !== null && getStatus(m.actual, m.target) === 'danger')
    .sort((a, b) => (a.actual! / a.target!) - (b.actual! / b.target!))
  const worst = dangerous[0]
  if (!worst) return null
  const action = ACTION_MAP[worst.label]
  if (!action) return null
  return { label: worst.label, action }
}

function fmt(val: number | null, suffix = '', digits = 0): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP', { maximumFractionDigits: digits }) + suffix
}

type Actuals = {
  totalSales: number
  totalVisits: number
  avgUnitPrice: number | null
  avgProductivity: number | null
  avgRepeatRate: number | null
}

function calcActuals(records: DailyRecord[]): Actuals {
  if (records.length === 0) {
    return { totalSales: 0, totalVisits: 0, avgUnitPrice: null, avgProductivity: null, avgRepeatRate: null }
  }
  const totalSales = records.reduce((s, r) => s + (r.sales ?? 0), 0)
  const totalVisits = records.reduce((s, r) => s + (r.visits ?? 0), 0)
  const totalWorkingHours = records.reduce((s, r) => s + (r.working_hours ?? 0), 0)
  const avgUnitPrice = totalVisits > 0 ? totalSales / totalVisits : null
  const avgProductivity = totalWorkingHours > 0 ? totalSales / totalWorkingHours : null
  const rr = records.filter((r) => r.repeat_rate !== null)
  const avgRepeatRate = rr.length > 0
    ? rr.reduce((s, r) => s + (r.repeat_rate ?? 0), 0) / rr.length : null
  return { totalSales, totalVisits, avgUnitPrice, avgProductivity, avgRepeatRate }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)

  // staffロールは自分の個人画面にリダイレクト
  const profile = await getServerProfile()
  if (profile?.role === 'staff' && profile.staff_id) {
    redirect(`/staff/${profile.staff_id}`)
  }

  const { data: stores } = await getActiveStores()

  let config: MonthlyConfig | null = null
  let records: DailyRecord[] = []
  let actuals: Actuals = { totalSales: 0, totalVisits: 0, avgUnitPrice: null, avgProductivity: null, avgRepeatRate: null }

  if (storeId) {
    const [configResult, recordsResult] = await Promise.all([
      getLatestMonthlyConfig(storeId),
      getDailyRecordsByMonth(storeId, currentMonth),
    ])
    await aggregateMonthlyRecords(storeId, currentMonth)
    config = configResult.data
    records = recordsResult.data
    actuals = calcActuals(records)
  }

  const metrics: MetricEntry[] = storeId
    ? [
        { label: '売上',   target: config?.target_sales ?? null,        actual: actuals.totalSales,      suffix: '円' },
        { label: '客単価', target: config?.target_unit_price ?? null,   actual: actuals.avgUnitPrice,    suffix: '円' },
        { label: '来店数', target: config?.target_visits ?? null,       actual: actuals.totalVisits,     suffix: '件' },
        { label: '生産性', target: config?.target_productivity ?? null, actual: actuals.avgProductivity, suffix: '', digits: 1 },
        { label: '再来率', target: config?.target_repeat_rate ?? null,  actual: actuals.avgRepeatRate,   suffix: '%', digits: 1 },
      ]
    : []

  const weeklyAction = storeId ? getWeeklyAction(metrics) : null

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
              <p className="text-gray-400 text-sm mt-0.5">{currentMonth} の実績</p>
            </div>
            <Link
              href={storeId ? `/monthly-config?storeId=${storeId}` : '/monthly-config'}
              className="text-xs text-gray-400 border border-gray-700 rounded-lg px-3 py-2 hover:border-gray-500 transition-colors"
            >
              月次基準値
            </Link>
          </div>

          {/* 店舗選択 */}
          <div className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-2">店舗</p>
            <StoreSelect stores={stores} selectedStoreId={storeId ?? ''} />
          </div>

          {storeId && (
            <>
              {/* 今週やること */}
              {weeklyAction && (
                <div className="bg-blue-900/30 border border-blue-800 rounded-2xl p-5 mb-6">
                  <p className="text-blue-400 font-bold text-sm mb-3">🎯 今週やること</p>
                  <p className="text-white text-lg font-semibold leading-snug mb-2">
                    {weeklyAction.action}
                  </p>
                  <p className="text-gray-400 text-sm">
                    ※ 今週はこの1つに集中してください（{weeklyAction.label}が最も達成率が低い指標です）
                  </p>
                </div>
              )}

              {/* 目標 vs 実績 */}
              <div className="mb-6">
                <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">目標 vs 実績</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metrics.map((m) => {
                    const status = m.actual !== null ? getStatus(m.actual, m.target) : null
                    return (
                      <div key={m.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-sm">{m.label}</span>
                          {status ? (
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                              {STATUS_LABEL[status]}
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-500">
                              未設定
                            </span>
                          )}
                        </div>
                        <p className="text-white text-2xl font-bold mb-3">
                          {fmt(m.actual, m.suffix, m.digits)}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>目標: {fmt(m.target, m.suffix, m.digits)}</span>
                          {m.target !== null && m.target > 0 && m.actual !== null && (
                            <span>{((m.actual / m.target) * 100).toFixed(1)}%</span>
                          )}
                        </div>
                        {m.target !== null && m.target > 0 && m.actual !== null && (
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${status ? STATUS_BAR[status] : 'bg-gray-600'}`}
                              style={{ width: `${Math.min(100, (m.actual / m.target) * 100).toFixed(1)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 日次実績一覧 */}
              <div>
                <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">
                  日次実績一覧 <span className="text-gray-600 normal-case">{records.length}件</span>
                </h2>
                {records.length === 0 ? (
                  <div className="bg-gray-900 rounded-2xl border border-gray-800 py-10 text-center text-gray-500 text-sm">
                    当月の実績データがありません
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-900">
                        <tr>
                          {['日付','売上','来客','客単価','再来率','口コミ'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {records.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-900/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-300 whitespace-nowrap">{r.record_date}</td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmt(r.sales, '円')}</td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmt(r.visits, '件')}</td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmt(r.unit_price, '円')}</td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                              {r.repeat_rate !== null ? `${r.repeat_rate}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmt(r.review_count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
