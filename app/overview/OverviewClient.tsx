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
  good:    'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  danger:  'bg-red-500/10 text-red-400',
  none:    'bg-white/5 text-[#8B94A7]',
}
const BADGE_LABEL: Record<BadgeStatus, string> = { good: '正常', warning: '注意', danger: '危険', none: '未入力' }
const PROGRESS_BAR: Record<BadgeStatus, string> = {
  good: 'bg-emerald-500', warning: 'bg-yellow-500', danger: 'bg-red-500', none: 'bg-[#8B94A7]',
}
const CARD_BORDER: Record<BadgeStatus, string> = {
  good:    'border-white/5',
  warning: 'border-white/5',
  danger:  'border-white/5',
  none:    'border-white/5',
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
function progressPct(val: number | null, target: number | null): number {
  if (val === null || target === null || target === 0) return 0
  return Math.min((val / target) * 100, 100)
}

// ──────────────────────────────────────────────
// 派生値
// ──────────────────────────────────────────────
type CauseType = 'achieved' | 'visits' | 'unit_price' | 'both' | 'no_data'

const CAUSE_ISSUE: Record<CauseType, string | null> = {
  achieved: null, visits: '集客不足', unit_price: '単価設計または提案不足', both: '集客・単価の両方が不足', no_data: null,
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
  issueLabel: string | null
  lastInputDate: string
}

function derive(s: StoreOverview): Derived {
  const sales = s.thisWeek?.sales ?? null
  const visits = s.thisWeek?.visits ?? null
  const unitPrice = sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = s.lastWeek?.sales ?? null
  const prevVisits = s.lastWeek?.visits ?? null
  const prevUnitPrice = prevSales !== null && (s.lastWeek?.visits ?? 0) > 0 ? Math.round(prevSales / s.lastWeek!.visits!) : null

  const weeklyTargetSales = s.config?.target_sales != null ? Math.round(s.config.target_sales / 4) : null
  const weeklyTargetVisits = s.config?.target_visits != null ? Math.round(s.config.target_visits / 4) : null
  const weeklyTargetUnitPrice = s.config?.target_unit_price ?? null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  let cause: CauseType = 'no_data'
  if (sales !== null) {
    if (salesStatus === 'good') { cause = 'achieved' }
    else {
      const visitsOk = visitsStatus === 'good' || weeklyTargetVisits === null
      const unitOk = unitPriceStatus === 'good' || weeklyTargetUnitPrice === null
      if (!visitsOk && !unitOk) cause = 'both'
      else if (!visitsOk) cause = 'visits'
      else if (!unitOk) cause = 'unit_price'
      else cause = 'both'
    }
  }

  return {
    sales, visits, unitPrice,
    weeklyTargetSales, weeklyTargetVisits, weeklyTargetUnitPrice,
    salesStatus,
    salesPct: fmtPct(sales, weeklyTargetSales),
    salesDiff: diffPctVal(sales, prevSales),
    visitsDiff: diffPctVal(visits, prevVisits),
    unitPriceDiff: diffPctVal(unitPrice, prevUnitPrice),
    issueLabel: CAUSE_ISSUE[cause],
    lastInputDate: fmtDate(s.thisWeek?.updated_at ?? s.thisWeek?.created_at),
  }
}

function DiffBadge({ val }: { val: number | null }) {
  if (val === null) return <span className="text-[#8B94A7] text-xs">-</span>
  return (
    <span className={`text-xs ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {val >= 0 ? '↑' : '↓'} {val >= 0 ? '+' : ''}{val.toFixed(1)}%
    </span>
  )
}

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

  useEffect(() => { loadData(weekStart) }, [weekStart, loadData])

  const derivedList = (data?.stores ?? []).map((s) => ({ s, d: derive(s) }))
  const dangerStores = derivedList.filter(({ d }) => d.salesStatus === 'danger')
  const inputtedCount = derivedList.filter(({ d }) => d.sales !== null).length
  const totalCount = derivedList.length

  return (
    <div className="space-y-4">
      {/* 週選択 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
        <label className="block text-sm text-[#8B94A7] mb-1">対象週（日曜日）</label>
        <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
          className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50" />
      </div>

      {fetching && <div className="text-center text-[#8B94A7] py-10 text-sm">データを読み込み中...</div>}

      {!fetching && data && (
        <>
          {/* 危険店舗アラート */}
          {dangerStores.length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-lg font-semibold mb-3">🚨 要対応店舗</h2>
              {dangerStores.map(({ s, d }) => (
                <div key={s.store.id} className="bg-[#111A2B] rounded-2xl p-4 border border-red-500/30 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#E6ECF5] text-lg font-bold">{s.store.store_name}</p>
                    <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold">危険</span>
                  </div>
                  <p className="text-red-400 text-sm mb-1">売上 目標比 {d.salesPct}</p>
                  {d.issueLabel && <p className="text-red-300 text-sm mb-3">課題：{d.issueLabel}</p>}
                  <button onClick={() => router.push(`/dashboard?storeId=${s.store.id}`)}
                    className="text-sm text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg px-3 py-1.5 hover:border-[#D4AF37]/60 transition">
                    → 詳細を見る
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 全店一覧 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#E6ECF5] text-lg font-semibold">
                📊 全店比較（{formatWeekLabel(weekStart)}）
              </h2>
              <span className="text-[#8B94A7] text-xs">入力済み：{inputtedCount} / {totalCount}店舗</span>
            </div>

            {derivedList.map(({ s, d }) => (
              <div key={s.store.id} className={`bg-[#111A2B] rounded-2xl p-4 border ${CARD_BORDER[d.salesStatus]} mb-3 ${d.sales === null ? 'opacity-60' : ''}`}>
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[#E6ECF5] text-lg font-bold">{s.store.store_name}</p>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${BADGE_CLASS[d.salesStatus]}`}>{BADGE_LABEL[d.salesStatus]}</span>
                </div>

                {d.sales === null ? (
                  <p className="text-[#8B94A7] text-sm">今週のデータ未入力</p>
                ) : (
                  <>
                    {/* 売上数値 */}
                    <p className="text-[#E6ECF5] text-2xl font-bold mb-1">{`¥${d.sales.toLocaleString('ja-JP')}`}</p>

                    {/* 達成率バー */}
                    {d.weeklyTargetSales !== null && (
                      <div className="h-1.5 bg-white/10 rounded-full mb-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${PROGRESS_BAR[d.salesStatus]}`}
                          style={{ width: `${progressPct(d.sales, d.weeklyTargetSales)}%` }}
                        />
                      </div>
                    )}

                    {/* サブ情報 */}
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      {d.weeklyTargetSales !== null && (
                        <span className="text-[#8B94A7] text-xs">目標比 <span className="text-[#E6ECF5]">{d.salesPct}</span></span>
                      )}
                      {d.salesDiff !== null && (
                        <span className="text-[#8B94A7] text-xs">先週比 <DiffBadge val={d.salesDiff} /></span>
                      )}
                      <span className="text-[#8B94A7] text-xs">最終入力 <span className="text-[#E6ECF5]">{d.lastInputDate}</span></span>
                    </div>

                    {/* 課題 */}
                    {d.issueLabel && (
                      <p className="text-[#D4AF37] text-sm">課題：{d.issueLabel}</p>
                    )}

                    {/* 詳細指標 */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-[#0B1220] rounded-xl p-2.5">
                        <p className="text-[#8B94A7] text-xs mb-0.5">客単価</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{fmtYen(d.unitPrice)}</p>
                        <DiffBadge val={d.unitPriceDiff} />
                      </div>
                      <div className="bg-[#0B1220] rounded-xl p-2.5">
                        <p className="text-[#8B94A7] text-xs mb-0.5">週客数</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{fmtNum(d.visits, '人')}</p>
                        <DiffBadge val={d.visitsDiff} />
                      </div>
                      <div className="bg-[#0B1220] rounded-xl p-2.5">
                        <p className="text-[#8B94A7] text-xs mb-0.5">目標</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{d.weeklyTargetSales !== null ? fmtYen(d.weeklyTargetSales) : '—'}</p>
                      </div>
                    </div>
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
