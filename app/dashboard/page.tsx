import Link from 'next/link'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import {
  getDailyRecordsByMonth,
  aggregateMonthlyRecords,
} from '@/lib/repositories/daily-records'
import type { MonthlyConfig, DailyRecord } from '@/lib/types/db'
import StoreSelect from './StoreSelect'

// ──────────────────────────────────────────────
// ステータス判定
// ──────────────────────────────────────────────
type Status = 'good' | 'warning' | 'danger'

function getStatus(actual: number, target: number | null): Status | null {
  if (target === null || target === 0) return null
  const ratio = actual / target
  if (ratio >= 0.9) return 'good'
  if (ratio >= 0.7) return 'warning'
  return 'danger'
}

const statusLabel: Record<Status, string> = {
  good: '達成',
  warning: '注意',
  danger: '危険',
}

const statusClass: Record<Status, string> = {
  good: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger: 'bg-red-100 text-red-800 border border-red-200',
}

// ──────────────────────────────────────────────
// 今週やること（目標達成率ベース）
// ──────────────────────────────────────────────
const ACTION_MAP: Record<string, string> = {
  '再来率': '施術中に次回来店時期を必ず口頭で伝える',
  '売上': 'カラー前にケア提案を1回必ず入れる',
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

// ──────────────────────────────────────────────
// フォーマット
// ──────────────────────────────────────────────
function fmt(val: number | null, suffix = '', digits = 0): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP', { maximumFractionDigits: digits }) + suffix
}

// ──────────────────────────────────────────────
// 実績計算
// ──────────────────────────────────────────────
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
    ? rr.reduce((s, r) => s + (r.repeat_rate ?? 0), 0) / rr.length
    : null
  return { totalSales, totalVisits, avgUnitPrice, avgProductivity, avgRepeatRate }
}

// ──────────────────────────────────────────────
// ページ
// ──────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const currentMonth = new Date().toISOString().slice(0, 7)

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
        { label: '売上',   target: config?.target_sales ?? null,        actual: actuals.totalSales,    suffix: '円' },
        { label: '客単価', target: config?.target_unit_price ?? null,   actual: actuals.avgUnitPrice,  suffix: '円' },
        { label: '来店数', target: config?.target_visits ?? null,       actual: actuals.totalVisits,   suffix: '件' },
        { label: '生産性', target: config?.target_productivity ?? null, actual: actuals.avgProductivity, suffix: '', digits: 1 },
        { label: '再来率', target: config?.target_repeat_rate ?? null,  actual: actuals.avgRepeatRate, suffix: '%', digits: 1 },
      ]
    : []

  const weeklyAction = storeId ? getWeeklyAction(metrics) : null

  return (
    <AuthGuard>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-sm text-gray-500 mt-0.5">{currentMonth} の実績</p>
            </div>
            <Link
              href={storeId ? `/monthly-config?storeId=${storeId}` : '/monthly-config'}
              className="text-xs md:text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap ml-4"
            >
              月次基準値
            </Link>
          </div>

          {/* 店舗選択 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">店舗</label>
            <StoreSelect stores={stores} selectedStoreId={storeId ?? ''} />
          </div>

          {storeId && (
            <>
              {/* 目標 vs 実績 */}
              <div className="mb-6">
                <h2 className="text-sm md:text-base font-semibold text-gray-800 mb-3">目標 vs 実績</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {metrics.map((m) => {
                    const status = m.actual !== null ? getStatus(m.actual, m.target) : null
                    return (
                      <div key={m.label} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">{m.label}</span>
                          {status ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[status]}`}>
                              {statusLabel[status]}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full text-gray-400 border border-gray-200">
                              未設定
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">目標</span>
                            <span className="font-medium text-gray-800">{fmt(m.target, m.suffix, m.digits)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">実績</span>
                            <span className={`font-semibold ${
                              status === 'good' ? 'text-green-700'
                              : status === 'warning' ? 'text-yellow-700'
                              : status === 'danger' ? 'text-red-700'
                              : 'text-gray-800'
                            }`}>
                              {fmt(m.actual, m.suffix, m.digits)}
                            </span>
                          </div>
                          {m.target !== null && m.target > 0 && m.actual !== null && (
                            <div className="pt-1">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    status === 'good' ? 'bg-green-500'
                                    : status === 'warning' ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (m.actual / m.target) * 100).toFixed(1)}%` }}
                                />
                              </div>
                              <p className="text-right text-xs text-gray-400 mt-0.5">
                                {((m.actual / m.target) * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 今週やること */}
              {weeklyAction && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    今週やること
                  </p>
                  <p className="text-sm md:text-base font-bold text-blue-900 mb-1">
                    {weeklyAction.action}
                  </p>
                  <p className="text-xs text-blue-500">
                    ※ 今週はこの1つに集中してください（{weeklyAction.label}が最も達成率が低い指標です）
                  </p>
                </div>
              )}

              {/* 日次実績一覧 */}
              <div>
                <h2 className="text-sm md:text-base font-semibold text-gray-800 mb-3">
                  日次実績一覧
                  <span className="ml-2 text-sm font-normal text-gray-400">{records.length}件</span>
                </h2>
                {records.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 py-10 text-center text-sm text-gray-500">
                    当月の日次実績データがありません
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['日付','売上','来店数','客単価','生産性','再来率','口コミ','新規','既存','稼働時間','メモ'].map((h) => (
                            <th key={h} className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {records.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 md:px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.record_date}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.sales, '円')}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.visits, '件')}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.unit_price, '円')}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">
                              {fmt(r.working_hours !== null && r.working_hours > 0 && r.sales !== null ? r.sales / r.working_hours : null, '', 1)}
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">
                              {r.repeat_rate !== null ? `${r.repeat_rate}%` : '—'}
                            </td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.review_count)}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.new_customers)}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.existing_customers)}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(r.working_hours, 'h', 1)}</td>
                            <td className="px-3 md:px-4 py-3 text-gray-500 max-w-xs truncate">{r.notes ?? '—'}</td>
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
      </main>
    </AuthGuard>
  )
}
