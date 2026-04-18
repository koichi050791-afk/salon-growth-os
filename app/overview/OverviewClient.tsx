'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchOverviewData } from './actions'
import type { OverviewData, StoreOverview } from './actions'

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function getSundayISO(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return sunday.toISOString().slice(0, 10)
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日週`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '未入力'
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
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
  none:    'bg-slate-800 text-slate-500',
}
const BADGE_LABEL: Record<BadgeStatus, string> = {
  good: '正常', warning: '注意', danger: '危険', none: '未入力',
}
const CARD_BORDER: Record<BadgeStatus, string> = {
  good:    'border-green-800/30',
  warning: 'border-yellow-800/30',
  danger:  'border-red-800/40',
  none:    'border-slate-700/50',
}

function fmtYen(val: number | null): string {
  if (val === null) return '—'
  return '¥' + val.toLocaleString('ja-JP')
}
function fmtNum(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}
function fmtPct(val: number | null, target: number | null): string {
  if (val === null || target === null || target === 0) return '—'
  return ((val / target) * 100).toFixed(1) + '%'
}

function diffPctVal(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null
  return ((current - prev) / prev) * 100
}

// ──────────────────────────────────────────────
// 派生値
// ──────────────────────────────────────────────
type CauseType = 'achieved' | 'visits' | 'unit_price' | 'both' | 'no_data'

const CAUSE_ISSUE: Record<CauseType, string | null> = {
  achieved:   null,
  visits:     '集客不足',
  unit_price: '単価設計または提案不足',
  both:       '集客・単価の両方が不足',
  no_data:    null,
}

const CAUSE_ACTION: Record<CauseType, string | null> = {
  achieved:   '今週の取り組みを来週も継続する',
  visits:     '仕上がり直後にその場でGoogleの口コミ投稿を案内する',
  unit_price: 'カラー前にケア提案を1回必ず入れる',
  both:       '施術中に次回来店時期を必ず口頭で伝える',
  no_data:    null,
}

type Derived = {
  sales: number | null
  visits: number | null
  unitPrice: number | null
  weeklyTargetSales: number | null
  weeklyTargetVisits: number | null
  weeklyTargetUnitPrice: number | null
  salesStatus: BadgeStatus
  salesPct: string
  salesDiff: number | null
  visitsDiff: number | null
  unitPriceDiff: number | null
  cause: CauseType
  issueLabel: string | null
  action: string | null
  lastInputDate: string
}

function derive(s: StoreOverview): Derived {
  const sales = s.thisWeek?.sales ?? null
  const visits = s.thisWeek?.visits ?? null
  const unitPrice =
    sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = s.lastWeek?.sales ?? null
  const prevVisits = s.lastWeek?.visits ?? null
  const prevUnitPrice =
    prevSales !== null && (s.lastWeek?.visits ?? 0) > 0
      ? Math.round(prevSales / s.lastWeek!.visits!) : null

  const weeklyTargetSales = s.config?.target_sales != null ? Math.round(s.config.target_sales / 4) : null
  const weeklyTargetVisits = s.config?.target_visits != null ? Math.round(s.config.target_visits / 4) : null
  const weeklyTargetUnitPrice = s.config?.target_unit_price ?? null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  let cause: CauseType = 'no_data'
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

  const lastInputDate = fmtDate(s.thisWeek?.updated_at ?? s.thisWeek?.created_at)

  return {
    sales, visits, unitPrice,
    weeklyTargetSales, weeklyTargetVisits, weeklyTargetUnitPrice,
    salesStatus,
    salesPct: fmtPct(sales, weeklyTargetSales),
    salesDiff: diffPctVal(sales, prevSales),
    visitsDiff: diffPctVal(visits, prevVisits),
    unitPriceDiff: diffPctVal(unitPrice, prevUnitPrice),
    cause,
    issueLabel: CAUSE_ISSUE[cause],
    action: CAUSE_ACTION[cause],
    lastInputDate,
  }
}

function DiffBadge({ val }: { val: number | null }) {
  if (val === null) return <span className="text-slate-500 text-xs">-</span>
  return (
    <span className={`text-xs ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
      {val >= 0 ? '↑' : '↓'} {val >= 0 ? '+' : ''}{val.toFixed(1)}%
    </span>
  )
}

const INPUT_CLASS =
  'w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500'
const LABEL_CLASS = 'block text-sm text-slate-400 mb-1.5'

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function OverviewClient() {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(getSundayISO())
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
  const dangerStores = derivedList.filter(({ d }) => d.salesStatus === 'danger')
  const inputtedCount = derivedList.filter(({ d }) => d.sales !== null).length
  const totalCount = derivedList.length

  return (
    <div>
      {/* 週選択 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-4 mb-4">
        <label className={LABEL_CLASS}>対象週（日曜日）</label>
        <input type="date" value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)} className={INPUT_CLASS} />
      </div>

      {fetching && (
        <div className="text-center text-slate-500 py-10 text-sm">データを読み込み中...</div>
      )}

      {!fetching && data && (
        <>
          {/* セクション1：危険店舗アラート */}
          {dangerStores.length > 0 && (
            <div className="mb-4">
              <h2 className="text-white text-lg font-bold mb-3">🚨 要対応店舗</h2>
              {dangerStores.map(({ s, d }) => (
                <div key={s.store.id} className="bg-gradient-to-br from-red-950 to-slate-900 border border-red-900/60 rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-lg font-bold">{s.store.store_name}</p>
                    <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">危険</span>
                  </div>
                  <p className="text-red-400 text-sm mb-1">売上 目標比 {d.salesPct}</p>
                  {d.issueLabel && (
                    <p className="text-red-300 text-sm mb-3">課題：{d.issueLabel}</p>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard?storeId=${s.store.id}`)}
                    className="text-sm text-blue-400 border border-blue-800 rounded-lg px-3 py-1.5 hover:border-blue-600 transition active:scale-[0.98]"
                  >
                    → 詳細を見る
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* セクション2：全店一覧 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-lg font-bold">
                📊 全店比較（{formatWeekLabel(weekStart)}）
              </h2>
              <span className="text-slate-400 text-sm">入力済み：{inputtedCount} / {totalCount}店舗</span>
            </div>

            {derivedList.map(({ s, d }) => (
              <div
                key={s.store.id}
                className={`bg-gradient-to-br from-slate-800 to-slate-900 border ${CARD_BORDER[d.salesStatus]} rounded-2xl p-5 mb-4`}
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white text-xl font-bold">{s.store.store_name}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${BADGE_CLASS[d.salesStatus]}`}>
                    {BADGE_LABEL[d.salesStatus]}
                  </span>
                </div>

                {d.sales !== null ? (
                  <>
                    {/* 売上進捗・先週比・課題 */}
                    <div className="mb-3 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {d.weeklyTargetSales !== null && (
                          <span className="text-slate-400 text-xs">
                            目標比 <span className="text-white font-bold">{d.salesPct}</span>
                          </span>
                        )}
                        {d.salesDiff !== null && (
                          <span className="text-slate-400 text-xs">
                            先週比 <DiffBadge val={d.salesDiff} />
                          </span>
                        )}
                        <span className="text-slate-400 text-xs">
                          最終入力 <span className="text-white text-sm">{d.lastInputDate}</span>
                        </span>
                      </div>
                      {d.issueLabel && (
                        <p className="text-amber-300 text-sm font-medium">課題：{d.issueLabel}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">週売上</p>
                        <p className="text-white text-2xl font-bold tracking-tight">{fmtYen(d.sales)}</p>
                        <DiffBadge val={d.salesDiff} />
                        {d.weeklyTargetSales !== null && (
                          <p className="text-slate-600 text-xs mt-0.5">目標 {fmtYen(d.weeklyTargetSales)}</p>
                        )}
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">客単価</p>
                        <p className="text-white text-2xl font-bold tracking-tight">{fmtYen(d.unitPrice)}</p>
                        <DiffBadge val={d.unitPriceDiff} />
                        {d.weeklyTargetUnitPrice !== null && (
                          <p className="text-slate-600 text-xs mt-0.5">目標 {fmtYen(d.weeklyTargetUnitPrice)}</p>
                        )}
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-1">週客数</p>
                        <p className="text-white text-2xl font-bold tracking-tight">{fmtNum(d.visits, '人')}</p>
                        <DiffBadge val={d.visitsDiff} />
                        {d.weeklyTargetVisits !== null && (
                          <p className="text-slate-600 text-xs mt-0.5">目標 {fmtNum(d.weeklyTargetVisits, '人')}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">今週のデータ未入力</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
