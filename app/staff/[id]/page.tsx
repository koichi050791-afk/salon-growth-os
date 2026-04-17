import { notFound } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getStaffById } from '@/lib/repositories/staff'
import { getRecentDailyRecords } from '@/lib/repositories/daily-records'
import { getActionLog } from '@/lib/repositories/action-logs'
import type { DailyRecord } from '@/lib/types/db'
import ActionLogClient from './ActionLogClient'

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
  good:    'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger:  'bg-red-900/50 text-red-400',
}

const STATUS_LABEL: Record<TrendStatus, string> = {
  good: '好調', warning: '普通', danger: '要注意',
}

const ACTION_MAP: Record<string, string> = {
  unit_price:   'カラー前にケア提案を1回必ず入れる',
  repeat_rate:  '施術中に次回来店時期を必ず口頭で伝える',
  review_count: '仕上がり直後に口コミ案内をその場で送る',
  sales:        'カラー前にケア提案を1回必ず入れる',
  visits:       '仕上がり直後に口コミ案内をその場で送る',
}

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

  type MetricStatus = {
    def: MetricDef
    currentValue: number | null
    status: TrendStatus | null
    changeRate: number | null
  }

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
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{staff.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">個人の改善状況</p>
          </div>

          {/* 今週やること */}
          {todayAction ? (
            <div className="bg-blue-900/30 border border-blue-800 rounded-2xl p-5 mb-6">
              <p className="text-blue-400 font-bold text-sm mb-3">🎯 今週やること</p>
              <p className="text-white text-lg font-semibold leading-snug mb-2">{todayAction}</p>
              <p className="text-gray-400 text-sm">※ 今週はこの1つに集中してください</p>
            </div>
          ) : latest ? (
            <div className="bg-green-900/20 border border-green-800 rounded-2xl p-5 mb-6">
              <p className="text-green-400 font-bold text-sm mb-1">✨ 今週は好調です</p>
              <p className="text-gray-400 text-sm">このペースを維持しましょう</p>
            </div>
          ) : null}

          {/* 今週の状態 */}
          {latest && (
            <div className="mb-6">
              <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">今週の状態</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metricStatuses.map(({ def, currentValue, status }) => (
                  <div key={def.key} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                    <p className="text-gray-400 text-xs mb-2">{def.label}</p>
                    <p className="text-white text-xl font-bold mb-2">
                      {fmt(currentValue, def.suffix, def.digits)}
                    </p>
                    {status ? (
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-500">
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
            <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">直近4週の推移</h2>
            {records.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 py-8 text-center text-gray-500 text-sm">
                記録がありません。週次入力から実績を登録してください。
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      {['週', '売上', '客数', '客単価', '次回予約率', '口コミ'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[...records].reverse().map((r) => {
                      const unitPrice = r.visits && r.visits > 0 && r.sales !== null
                        ? Math.round(r.sales / r.visits) : null
                      const isLatest = r.id === latest?.id
                      return (
                        <tr key={r.id} className={isLatest ? 'bg-blue-900/20' : 'hover:bg-gray-900/50 transition-colors'}>
                          <td className="px-3 py-3 font-medium whitespace-nowrap">
                            <span className={isLatest ? 'text-blue-400' : 'text-gray-300'}>{r.record_date}</span>
                            {isLatest && <span className="ml-1 text-xs text-blue-500">今週</span>}
                          </td>
                          <td className="px-3 py-3 text-gray-300 whitespace-nowrap">{fmt(r.sales, '円')}</td>
                          <td className="px-3 py-3 text-gray-300 whitespace-nowrap">{fmt(r.visits, '人')}</td>
                          <td className="px-3 py-3 text-gray-300 whitespace-nowrap">{fmt(unitPrice, '円')}</td>
                          <td className="px-3 py-3 text-gray-300 whitespace-nowrap">
                            {r.repeat_rate !== null ? `${r.repeat_rate}%` : '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-300 whitespace-nowrap">{fmt(r.review_count, '件')}</td>
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
      </div>
    </AuthGuard>
  )
}
