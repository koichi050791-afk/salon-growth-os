'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchOverviewData } from './actions'
import type { OverviewData, StoreOverview } from './actions'

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

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日週`
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
  good: '達成', warning: '注意', danger: '危険', none: '未入力',
}

const CARD_CLASS: Record<BadgeStatus, string> = {
  good:    'bg-green-900/20 border border-green-800',
  warning: 'bg-yellow-900/20 border border-yellow-800',
  danger:  'bg-red-900/20 border border-red-800',
  none:    'bg-gray-900 border border-gray-800',
}

function fmt(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}

function fmtPct(val: number | null, target: number | null): string {
  if (val === null || target === null || target === 0) return '—'
  return ((val / target) * 100).toFixed(1) + '%'
}

function diffPctStr(current: number | null, prev: number | null): string | null {
  if (current === null || prev === null || prev === 0) return null
  const p = ((current - prev) / prev) * 100
  const sign = p >= 0 ? '+' : ''
  return `前週比 ${sign}${p.toFixed(1)}%`
}

function diffPctPositive(current: number | null, prev: number | null): boolean {
  if (current === null || prev === null || prev === 0) return true
  return current >= prev
}

// ──────────────────────────────────────────────
// 派生値を計算
// ──────────────────────────────────────────────
type Derived = {
  sales: number | null
  visits: number | null
  unitPrice: number | null
  prevSales: number | null
  weeklyTargetSales: number | null
  weeklyTargetVisits: number | null
  weeklyTargetUnitPrice: number | null
  salesStatus: BadgeStatus
  visitsStatus: BadgeStatus
  unitPriceStatus: BadgeStatus
  salesPct: string
  diff: string | null
  diffUp: boolean
  cause: 'achieved' | 'visits' | 'unit_price' | 'both' | 'no_data'
}

function derive(s: StoreOverview): Derived {
  const sales = s.thisWeek?.sales ?? null
  const visits = s.thisWeek?.visits ?? null
  const unitPrice =
    sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = s.lastWeek?.sales ?? null

  const weeklyTargetSales =
    s.config?.target_sales != null ? Math.round(s.config.target_sales / 4) : null
  const weeklyTargetVisits =
    s.config?.target_visits != null ? Math.round(s.config.target_visits / 4) : null
  const weeklyTargetUnitPrice = s.config?.target_unit_price ?? null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  const salesPct = fmtPct(sales, weeklyTargetSales)
  const diff = diffPctStr(sales, prevSales)
  const diffUp = diffPctPositive(sales, prevSales)

  let cause: Derived['cause'] = 'no_data'
  if (sales !== null) {
    if (salesStatus === 'good') {
      cause = 'achieved'
    } else {
      const visitsOk = visitsStatus === 'good' || weeklyTargetVisits === null
      const unitOk = unitPriceStatus === 'good' || weeklyTargetUnitPrice === null
      if (!visitsOk && !unitOk) cause = 'both'
      else if (!visitsOk) cause = 'visits'
      else if (!unitOk) cause = 'unit_price'
      else cause = 'both'
    }
  }

  return {
    sales, visits, unitPrice, prevSales,
    weeklyTargetSales, weeklyTargetVisits, weeklyTargetUnitPrice,
    salesStatus, visitsStatus, unitPriceStatus,
    salesPct, diff, diffUp, cause,
  }
}

const CAUSE_LABEL: Record<string, string> = {
  visits:     '原因：客数不足',
  unit_price: '原因：客単価不足',
  both:       '原因：客数・客単価の両方が不足',
}

const INPUT_CLASS =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500'
const LABEL_CLASS = 'block text-sm text-gray-400 mb-1.5'

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function OverviewClient() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(getMondayISO())
  const [data, setData] = useState<OverviewData | null>(null)
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async (week: string) => {
    setFetching(true)
    const result = await fetchOverviewData(week)
    setData(result)
    setFetching(false)
  }, [])

  useEffect(() => {
    loadData(weekStart)
  }, [weekStart, loadData])

  const derivedList = (data?.stores ?? []).map((s) => ({ s, d: derive(s) }))

  // 危険店舗（売上目標比70%未満）
  const dangerStores = derivedList.filter(({ d }) => d.salesStatus === 'danger')

  // 全店合計
  const totalSales = derivedList.reduce((sum, { d }) => sum + (d.sales ?? 0), 0)
  const totalVisits = derivedList.reduce((sum, { d }) => sum + (d.visits ?? 0), 0)
  const avgUnitPrice = totalVisits > 0 ? Math.round(totalSales / totalVisits) : null
  const inputtedCount = derivedList.filter(({ d }) => d.sales !== null).length
  const totalCount = derivedList.length

  return (
    <div>
      {/* 週選択 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-4">
        <label className={LABEL_CLASS}>対象週（月曜日）</label>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {fetching && (
        <div className="text-center text-gray-500 py-10 text-sm">データを読み込み中...</div>
      )}

      {!fetching && data && (
        <>
          {/* セクション1：危険店舗アラート */}
          {dangerStores.length > 0 && (
            <div className="mb-4">
              <h2 className="text-white text-lg font-bold mb-3">🚨 要対応店舗</h2>
              {dangerStores.map(({ s, d }) => (
                <div
                  key={s.store.id}
                  className="bg-red-900/30 border border-red-800 rounded-2xl p-4 mb-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-lg font-bold">{s.store.store_name}</p>
                    <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">危険</span>
                  </div>
                  <p className="text-red-400 text-sm mb-1">
                    売上 目標比 {d.salesPct}
                  </p>
                  {d.cause !== 'no_data' && d.cause !== 'achieved' && (
                    <p className="text-red-300 text-sm mb-3">{CAUSE_LABEL[d.cause]}</p>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard?storeId=${s.store.id}`)}
                    className="text-sm text-blue-400 border border-blue-800 rounded-lg px-3 py-1.5 hover:border-blue-600 transition-colors"
                  >
                    → 詳細を見る
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* セクション3：全店合計（先に配置） */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
            <h2 className="text-white text-lg font-bold mb-4">🏢 全店合計</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">全店売上合計</p>
                <p className="text-white text-2xl font-bold">{fmt(totalSales, '円')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">全店客数合計</p>
                <p className="text-white text-2xl font-bold">{fmt(totalVisits, '人')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">全店平均客単価</p>
                <p className="text-white text-2xl font-bold">{fmt(avgUnitPrice, '円')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">入力済み</p>
                <p className="text-white text-2xl font-bold">
                  {inputtedCount}
                  <span className="text-gray-500 text-base font-normal"> / {totalCount}店舗</span>
                </p>
              </div>
            </div>
          </div>

          {/* セクション2：全店一覧 */}
          <div>
            <h2 className="text-white text-lg font-bold mb-3">
              📊 全店比較（{formatWeekLabel(weekStart)}）
            </h2>
            {derivedList.map(({ s, d }) => (
              <div
                key={s.store.id}
                className={`rounded-2xl p-5 mb-3 ${CARD_CLASS[d.salesStatus]}`}
              >
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-bold text-base">{s.store.store_name}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${BADGE_CLASS[d.salesStatus]}`}>
                    {BADGE_LABEL[d.salesStatus]}
                  </span>
                </div>

                {d.sales === null ? (
                  <p className="text-gray-500 text-sm">今週のデータ未入力</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">週売上</p>
                        <p className="text-white font-medium text-sm">{fmt(d.sales, '円')}</p>
                        <p className="text-gray-600 text-xs">
                          目標: {fmt(d.weeklyTargetSales, '円')}
                        </p>
                        <p className={`text-xs ${d.salesStatus === 'danger' ? 'text-red-400' : d.salesStatus === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
                          {d.salesPct}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">週客数</p>
                        <p className="text-white font-medium text-sm">{fmt(d.visits, '人')}</p>
                        <p className="text-gray-600 text-xs">
                          目標: {fmt(d.weeklyTargetVisits, '人')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-0.5">客単価</p>
                        <p className="text-white font-medium text-sm">{fmt(d.unitPrice, '円')}</p>
                        <p className="text-gray-600 text-xs">
                          目標: {fmt(d.weeklyTargetUnitPrice, '円')}
                        </p>
                      </div>
                    </div>
                    {d.diff && (
                      <p className={`text-xs ${d.diffUp ? 'text-green-400' : 'text-red-400'}`}>
                        {d.diff}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
