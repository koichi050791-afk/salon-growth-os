import { notFound } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getStaffById } from '@/lib/repositories/staff'
import { getRecentDailyRecords } from '@/lib/repositories/daily-records'
import { getActionLog } from '@/lib/repositories/action-logs'
import type { DailyRecord } from '@/lib/types/db'
import ActionLogClient from './ActionLogClient'

// ──────────────────────────────────────────────
// 危険度判定
// ──────────────────────────────────────────────
type TrendStatus = 'good' | 'warning' | 'danger'

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

function trendStatus(current: number, med: number): TrendStatus {
  if (med === 0) return 'warning'
  const rate = (current - med) / med
  if (rate <= -0.15) return 'danger'
  if (rate >= 0.15) return 'good'
  return 'warning'
}

const STATUS_BADGE: Record<TrendStatus, string> = {
  good: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger: 'bg-red-100 text-red-800 border border-red-200',
}

const STATUS_LABEL: Record<TrendStatus, string> = {
  good: '好調',
  warning: '普通',
  danger: '要注意',
}

// ──────────────────────────────────────────────
// アクション対応表
// ──────────────────────────────────────────────
const ACTION_MAP: Record<string, string> = {
  unit_price:   'カラー前にケア提案を1回必ず入れる',
  repeat_rate:  '施術中に次回来店時期を必ず口頭で伝える',
  review_count: '仕上がり直後に口コミ案内をその場で送る',
  sales:        'カラー前にケア提案を1回必ず入れる',
  visits:       '仕上がり直後に口コミ案内をその場で送る',
}

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function fmt(val: number | null, suffix = '', digits = 0): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP', { maximumFractionDigits: digits }) + suffix
}

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return d.toISOString().slice(0, 10)
}

type MetricDef = {
  key: string
  label: string
  suffix: string
  digits?: number
  compute: (r: DailyRecord) => number | null
}

const METRIC_DEFS: MetricDef[] = [
  { key: 'sales',        label: '売上',      suffix: '円', compute: (r) => r.sales },
  { key: 'visits',       label: '客数',      suffix: '人', compute: (r) => r.visits },
  { key: 'unit_price',   label: '客単価',    suffix: '円', compute: (r) => r.visits && r.visits > 0 && r.sales !== null ? Math.round(r.sales / r.visits) : null },
  { key: 'repeat_rate',  label: '次回予約率', suffix: '%', digits: 1, compute: (r) => r.repeat_rate },
  { key: 'review_count', label: '口コミ数',  suffix: '件', compute: (r) => r.review_count },
]

// ──────────────────────────────────────────────
// ページ
// ──────────────────────────────────────────────
export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: staff } = await getStaffById(id)
  if (!staff) notFound()

  const { data: records } = await getRecentDailyRecords(staff.store_id, 4)

  const currentWeek = getMondayISO(new Date())
  const { data: actionLog } = await getActionLog(staff.id, currentWeek)

  const latest = records.length > 0 ? records[records.length - 1] : null
  const previous = records.length > 1 ? records.slice(0, -1) : []

  type MetricStatus = { def: MetricDef; currentValue: number | null; status: TrendStatus | null; changeRate: number | null }

  const metricStatuses: MetricStatus[] = METRIC_DEFS.map((def) => {
    const currentValue = latest ? def.compute(latest) : null
    if (currentValue === null || previous.length === 0) {
      return { def, currentValue, status: null, changeRate: null }
    }
    const prevValues = previous.map(def.compute).filter((v): v is number => v !== null)
    const med = median(prevValues)
    if (med === null) return { def, currentValue, status: null, changeRate: null }
    const changeRate = med !== 0 ? (currentValue - med) / med : null
    return { def, currentValue, status: trendStatus(currentValue, med), changeRate }
  })

  const worstMetric = (() => {
    const danger = metricStatuses
      .filter((m) => m.status === 'danger')
      .sort((a, b) => (a.changeRate ?? 0) - (b.changeRate ?? 0))
    return danger[0] ?? null
  })()

  const todayAction = worstMetric ? (ACTION_MAP[worstMetric.def.key] ?? null) : null
  const actionForLog = todayAction ?? 'データを確認し、先週と何が違ったか振り返る'

  return (
    <AuthGuard>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {/* ヘッダー */}
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{staff.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">個人の改善状況</p>
          </div>

          {/* 今週やること */}
          {todayAction && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                今週やること
              </p>
              <p className="text-sm md:text-base font-bold text-blue-900 mb-1">{todayAction}</p>
              <p className="text-xs text-blue-500">※ 今週はこの1つに集中してください</p>
            </div>
          )}

          {/* 今週の状態 */}
          {latest && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">今週の状態</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {metricStatuses.map(({ def, currentValue, status }) => (
                  <div key={def.key} className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{def.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {fmt(currentValue, def.suffix, def.digits)}
                    </p>
                    {status ? (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full text-gray-400 border border-gray-200">
                        データ不足
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 直近4週の推移 */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">直近4週の推移</h2>
            {records.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 py-8 text-center text-sm text-gray-500">
                記録がありません。週次入力から実績を登録してください。
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['週', '売上', '客数', '客単価', '次回予約率', '口コミ数'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {[...records].reverse().map((r) => {
                      const unitPrice = r.visits && r.visits > 0 && r.sales !== null
                        ? Math.round(r.sales / r.visits) : null
                      const isLatest = r.id === latest?.id
                      return (
                        <tr key={r.id} className={isLatest ? 'bg-blue-50' : 'hover:bg-gray-50 transition-colors'}>
                          <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {r.record_date}
                            {isLatest && <span className="ml-1 text-xs text-blue-600">（今週）</span>}
                          </td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmt(r.sales, '円')}</td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmt(r.visits, '人')}</td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmt(unitPrice, '円')}</td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                            {r.repeat_rate !== null ? `${r.repeat_rate}%` : '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmt(r.review_count, '件')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 改善ログ */}
          <ActionLogClient
            staffId={staff.id}
            weekDate={currentWeek}
            actionText={actionForLog}
            currentStatus={actionLog?.is_executed ?? null}
          />
        </div>
      </main>
    </AuthGuard>
  )
}
