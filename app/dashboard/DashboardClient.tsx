'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchDashboardData } from './actions'
import type { Store } from '@/lib/types/db'
import type { DashboardData } from './actions'

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function getMondayISO(): string {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return monday.toISOString().slice(0, 10)
}

type BadgeStatus = 'good' | 'warning' | 'danger' | 'none'

function getStatus(val: number | null, target: number | null): BadgeStatus {
  if (val === null || target === null || target === 0) return 'none'
  const r = val / target
  if (r >= 0.9) return 'good'
  if (r >= 0.7) return 'warning'
  return 'danger'
}

const BADGE_CLASS: Record<BadgeStatus, string> = {
  good:    'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger:  'bg-red-900/50 text-red-400',
  none:    'bg-gray-800 text-gray-500',
}
const BADGE_LABEL: Record<BadgeStatus, string> = {
  good: '達成', warning: '注意', danger: '危険', none: 'データなし',
}

function fmt(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}

function diffPctStr(current: number | null, prev: number | null): string | null {
  if (current === null || prev === null || prev === 0) return null
  const p = ((current - prev) / prev) * 100
  const sign = p >= 0 ? '+' : ''
  return `前週比 ${sign}${p.toFixed(1)}%`
}

function diffPctPositive(current: number | null, prev: number | null): boolean | null {
  if (current === null || prev === null || prev === 0) return null
  return current >= prev
}

function gapStr(val: number | null, target: number | null, suffix = '円'): string | null {
  if (val === null || target === null) return null
  const gap = target - val
  if (gap <= 0) return null
  return `目標まで ▲${gap.toLocaleString('ja-JP')}${suffix}`
}

const INPUT_CLASS =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500'
const LABEL_CLASS = 'block text-sm text-gray-400 mb-1.5'

// ──────────────────────────────────────────────
// サマリーカード
// ──────────────────────────────────────────────
function MetricCard({
  label,
  value,
  suffix,
  target,
  prevValue,
}: {
  label: string
  value: number | null
  suffix: string
  target: number | null
  prevValue: number | null
}) {
  const status = getStatus(value, target)
  const gap = gapStr(value, target, suffix)
  const diff = diffPctStr(value, prevValue)
  const diffUp = diffPctPositive(value, prevValue)

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${BADGE_CLASS[status]}`}>
          {BADGE_LABEL[status]}
        </span>
      </div>

      <p className="text-white text-3xl font-bold mb-2">{fmt(value, suffix)}</p>

      <div className="space-y-1">
        {status === 'good' ? (
          <p className="text-green-400 text-sm font-medium">目標達成 ✅</p>
        ) : gap ? (
          <p className="text-red-400 text-sm">{gap}</p>
        ) : null}

        {diff && (
          <p className={`text-sm ${diffUp ? 'text-green-400' : 'text-red-400'}`}>{diff}</p>
        )}

        {target !== null && (
          <p className="text-gray-600 text-xs">目標: {fmt(target, suffix)}</p>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function DashboardClient({
  stores,
  initialStoreId,
}: {
  stores: Store[]
  initialStoreId: string
}) {
  const router = useRouter()
  const [storeId, setStoreId] = useState(initialStoreId)
  const [weekStart, setWeekStart] = useState(getMondayISO())
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async (sid: string, week: string) => {
    if (!sid) return
    setFetching(true)
    const result = await fetchDashboardData(sid, week)
    setData(result)
    setFetching(false)
  }, [])

  useEffect(() => {
    loadData(storeId, weekStart)
  }, [storeId, weekStart, loadData])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStoreId(val)
    router.replace(val ? `/dashboard?storeId=${val}` : '/dashboard')
  }

  // ── 派生値 ──
  const weeklyTargetSales =
    data?.config?.target_sales != null ? Math.round(data.config.target_sales / 4) : null
  const weeklyTargetVisits =
    data?.config?.target_visits != null ? Math.round(data.config.target_visits / 4) : null
  const weeklyTargetUnitPrice = data?.config?.target_unit_price ?? null

  const sales = data?.thisWeek?.sales ?? null
  const visits = data?.thisWeek?.visits ?? null
  const unitPrice =
    sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null

  const prevSales = data?.lastWeek?.sales ?? null
  const prevVisits = data?.lastWeek?.visits ?? null
  const prevUnitPrice =
    prevSales !== null && prevVisits !== null && prevVisits > 0
      ? Math.round(prevSales / prevVisits)
      : null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  // ── 原因分解 ──
  type CauseType = 'achieved' | 'visits' | 'unit_price' | 'both' | 'no_data'

  function getCause(): CauseType {
    if (sales === null) return 'no_data'
    if (salesStatus === 'good') return 'achieved'
    const visitsOk = visitsStatus === 'good' || weeklyTargetVisits === null
    const unitOk = unitPriceStatus === 'good' || weeklyTargetUnitPrice === null
    if (!visitsOk && !unitOk) return 'both'
    if (!visitsOk) return 'visits'
    if (!unitOk) return 'unit_price'
    return 'both'
  }

  const cause = getCause()

  const CAUSE_CONFIG = {
    achieved: {
      color: 'text-green-400',
      title: '✅ 今週は目標達成です',
      desc: '今週の取り組みを継続しましょう。',
      action: '今週の取り組みを来週も継続する',
    },
    visits: {
      color: 'text-red-400',
      title: '原因：客数不足',
      desc: '客数を増やす施策を優先してください。',
      action: '仕上がり直後に口コミ案内をその場で送る',
    },
    unit_price: {
      color: 'text-yellow-400',
      title: '原因：客単価不足',
      desc: '客単価を上げる施策を優先してください。',
      action: 'カラー前にケア提案を1回必ず入れる',
    },
    both: {
      color: 'text-red-400',
      title: '原因：客数・客単価の両方が不足',
      desc: 'どちらも改善が必要です。',
      action: '施術中に次回来店時期を必ず口頭で伝える',
    },
    no_data: null,
  }

  const causeConfig = CAUSE_CONFIG[cause]

  // ── スタッフ一覧 ──
  const staffCards = (data?.staffList ?? []).map((s) => {
    const thisInput = data?.thisWeekStaff.find((i) => i.staff_id === s.id) ?? null
    const lastInput = data?.lastWeekStaff.find((i) => i.staff_id === s.id) ?? null

    const staffSales = thisInput?.sales ?? null
    const staffVisits = thisInput?.visits ?? null
    const staffUnit =
      staffSales !== null && staffVisits !== null && staffVisits > 0
        ? Math.round(staffSales / staffVisits)
        : null
    const prevStaffSales = lastInput?.sales ?? null

    const salesDiff =
      staffSales !== null && prevStaffSales !== null && prevStaffSales > 0
        ? ((staffSales - prevStaffSales) / prevStaffSales) * 100
        : null

    const isAlert = salesDiff !== null && salesDiff <= -20

    return { s, staffSales, staffVisits, staffUnit, salesDiff, isAlert }
  })

  return (
    <div>
      {/* 店舗・週選択 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-4 space-y-3">
        <div>
          <label className={LABEL_CLASS}>店舗</label>
          <select value={storeId} onChange={handleStoreChange} className={INPUT_CLASS}>
            <option value="">-- 店舗を選択 --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.store_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>対象週（月曜日）</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {fetching && (
        <div className="text-center text-gray-500 py-10 text-sm">データを読み込み中...</div>
      )}

      {!fetching && storeId && data && (
        <>
          {/* セクション1：今週のサマリー */}
          <div className="mb-4">
            <h2 className="text-white text-lg font-bold mb-3">📈 今週のサマリー</h2>
            <div className="space-y-3">
              <MetricCard
                label="週売上"
                value={sales}
                suffix="円"
                target={weeklyTargetSales}
                prevValue={prevSales}
              />
              <MetricCard
                label="週客数"
                value={visits}
                suffix="人"
                target={weeklyTargetVisits}
                prevValue={prevVisits}
              />
              <MetricCard
                label="客単価"
                value={unitPrice}
                suffix="円"
                target={weeklyTargetUnitPrice}
                prevValue={prevUnitPrice}
              />
            </div>
          </div>

          {/* セクション2：原因分解 */}
          {causeConfig && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
              <h2 className="text-white text-lg font-bold mb-3">📊 原因分解</h2>
              <p className={`text-xl font-bold mb-1 ${causeConfig.color}`}>
                {causeConfig.title}
              </p>
              <p className="text-gray-400 text-sm">{causeConfig.desc}</p>
            </div>
          )}

          {/* セクション3：スタッフ別 */}
          {staffCards.length > 0 && (
            <div className="mb-4">
              <h2 className="text-white text-lg font-bold mb-3">👤 スタッフ別</h2>
              {staffCards.map(({ s, staffSales, staffVisits, staffUnit, salesDiff, isAlert }) => (
                <div
                  key={s.id}
                  className={`rounded-2xl p-4 mb-3 border ${
                    isAlert
                      ? 'bg-red-900/30 border-red-800'
                      : 'bg-gray-900 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold">{s.name}</p>
                    {isAlert && (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
                        ⚠️ 先週より大きく下落
                      </span>
                    )}
                  </div>

                  {staffSales === null && staffVisits === null ? (
                    <p className="text-gray-500 text-sm">今週のデータがありません</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">週売上</p>
                        <p className="text-white font-medium text-sm">{fmt(staffSales, '円')}</p>
                        {salesDiff !== null && (
                          <p className={`text-xs mt-0.5 ${salesDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {salesDiff >= 0 ? '↑' : '↓'} {salesDiff >= 0 ? '+' : ''}{salesDiff.toFixed(1)}%
                          </p>
                        )}
                        {salesDiff === null && (
                          <p className="text-gray-500 text-xs mt-0.5">-</p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">週客数</p>
                        <p className="text-white font-medium text-sm">{fmt(staffVisits, '人')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">客単価</p>
                        <p className="text-white font-medium text-sm">{fmt(staffUnit, '円')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* セクション4：今週やること */}
          {causeConfig && (
            <div className="bg-blue-900/30 border border-blue-800 rounded-2xl p-5 mb-4">
              <h2 className="text-white text-lg font-bold mb-3">🎯 今週やること</h2>
              <p className="text-white text-lg font-bold mb-2">{causeConfig.action}</p>
              <p className="text-gray-400 text-sm">※ 今週はこの1つに集中してください</p>
            </div>
          )}
        </>
      )}

      {!storeId && !fetching && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 py-12 text-center text-gray-500 text-sm">
          店舗を選択してください
        </div>
      )}
    </div>
  )
}
