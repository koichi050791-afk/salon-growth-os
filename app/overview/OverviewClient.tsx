'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchOverviewData } from './actions'
import type { OverviewData, StoreOverview } from './actions'
import {
  calcMonthlyProductivity,
  calcElapsedWorkingDays,
  formatMonthlyProductivity,
  getMonthlyProductivityStatus,
} from '@/lib/calculations'

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
type InputStatus = 'entered' | 'not_entered' | 'overdue'

function getStatus(val: number | null, target: number | null): BadgeStatus {
  if (val === null || target === null || target === 0) return 'none'
  const r = val / target
  if (r >= 0.9) return 'good'
  if (r >= 0.7) return 'warning'
  return 'danger'
}

function getInputStatus(weekStart: string, hasData: boolean): InputStatus {
  if (hasData) return 'entered'
  const currentSunday = getSundayISO()
  if (weekStart < currentSunday) return 'overdue'
  return 'not_entered'
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

const INPUT_BADGE: Record<InputStatus, string> = {
  entered:     'bg-emerald-900/30 text-emerald-400',
  not_entered: 'bg-red-900/30 text-red-400',
  overdue:     'bg-red-900/50 text-red-400 font-bold',
}
const INPUT_BADGE_LABEL: Record<InputStatus, string> = {
  entered:     '✅ 入力済み',
  not_entered: '❌ 未入力',
  overdue:     '⚠️ 期限超過',
}

const MONTHLY_PROD_BADGE_CLASS: Record<'success' | 'warning' | 'danger' | 'none', string> = {
  success: 'bg-emerald-900/30 text-emerald-400',
  warning: 'bg-amber-900/30 text-amber-400',
  danger:  'bg-red-900/30 text-red-400',
  none:    'bg-[#1E293B] text-[#8B94A7]',
}
const MONTHLY_PROD_BADGE_LABEL: Record<'success' | 'warning' | 'danger' | 'none', string> = {
  success: '優良', warning: '標準', danger: '危険', none: '未設定',
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
  monthlyProd: number | null
  monthlyProdStatus: 'success' | 'warning' | 'danger' | 'none'
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
  inputStatus: InputStatus
}

function derive(s: StoreOverview, weekStart: string): Derived {
  const sales = s.thisWeek?.sales ?? null
  const visits = s.thisWeek?.visits ?? null
  const unitPrice = sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = s.lastWeek?.sales ?? null
  const prevVisits = s.lastWeek?.visits ?? null
  const prevUnitPrice = prevSales !== null && (s.lastWeek?.visits ?? 0) > 0 ? Math.round(prevSales / s.lastWeek!.visits!) : null

  const weeklyTargetSales = s.config?.target_sales != null ? Math.round(s.config.target_sales / 4.3) : null
  const weeklyTargetVisits = s.config?.target_visits != null ? Math.round(s.config.target_visits / 4.3) : null
  const weeklyTargetUnitPrice = s.config?.target_unit_price ?? null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  const elapsedDays = calcElapsedWorkingDays(new Date())
  const workingDays = s.config?.working_days ?? null
  const activeStaffCount = s.config?.active_staff_count ?? null
  const monthlyProd = s.monthlySales !== null
    ? calcMonthlyProductivity(s.monthlySales, elapsedDays, workingDays, activeStaffCount)
    : null
  const monthlyProdStatus = getMonthlyProductivityStatus(monthlyProd)

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
    sales, visits, unitPrice, monthlyProd, monthlyProdStatus,
    weeklyTargetSales, weeklyTargetVisits, weeklyTargetUnitPrice,
    salesStatus,
    salesPct: fmtPct(sales, weeklyTargetSales),
    salesDiff: diffPctVal(sales, prevSales),
    visitsDiff: diffPctVal(visits, prevVisits),
    unitPriceDiff: diffPctVal(unitPrice, prevUnitPrice),
    issueLabel: CAUSE_ISSUE[cause],
    lastInputDate: fmtDate(s.thisWeek?.updated_at ?? s.thisWeek?.created_at),
    inputStatus: getInputStatus(weekStart, sales !== null),
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

  const allDerived = (data?.stores ?? []).map((s) => ({ s, d: derive(s, weekStart) }))

  // 未入力・期限超過を上部に表示
  const sorted = [
    ...allDerived.filter(({ d }) => d.inputStatus !== 'entered'),
    ...allDerived.filter(({ d }) => d.inputStatus === 'entered'),
  ]

  const enteredCount = allDerived.filter(({ d }) => d.inputStatus === 'entered').length
  const totalCount = allDerived.length
  const allDone = totalCount > 0 && enteredCount === totalCount
  const noneEntered = enteredCount === 0

  const progressBarColor = allDone ? 'bg-emerald-500' : noneEntered ? 'bg-red-500' : 'bg-amber-500'
  const progressPctNum = totalCount > 0 ? Math.round((enteredCount / totalCount) * 100) : 0

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
          {/* 入力完了率セクション */}
          <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
            <p className="text-[#E6ECF5] font-semibold mb-3">今週の入力状況</p>
            <p className="text-[#E6ECF5] text-2xl font-bold mb-3">
              {enteredCount} <span className="text-[#8B94A7] text-base font-normal">/ {totalCount} 店舗入力済み</span>
            </p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressBarColor}`}
                style={{ width: `${progressPctNum}%` }}
              />
            </div>
            <p className={`text-xs mt-2 ${allDone ? 'text-emerald-400' : noneEntered ? 'text-red-400' : 'text-amber-400'}`}>
              {allDone ? '✅ 全店舗入力完了' : noneEntered ? '❌ 全店舗未入力' : `⚠️ ${totalCount - enteredCount}店舗が未入力`}
            </p>
          </div>

          {/* 全店一覧 */}
          <div>
            <h2 className="text-[#E6ECF5] text-lg font-semibold mb-3">
              📊 全店比較（{formatWeekLabel(weekStart)}）
            </h2>

            {sorted.map(({ s, d }) => (
              <div
                key={s.store.id}
                className={`bg-[#111A2B] rounded-2xl p-4 mb-3 border ${
                  d.inputStatus === 'overdue'
                    ? 'border-red-500/40'
                    : d.inputStatus === 'not_entered'
                    ? 'border-red-500/20'
                    : 'border-white/5'
                }`}
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[#E6ECF5] text-lg font-bold">{s.store.store_name}</p>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${INPUT_BADGE[d.inputStatus]}`}>
                      {INPUT_BADGE_LABEL[d.inputStatus]}
                    </span>
                    {d.inputStatus === 'entered' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${BADGE_CLASS[d.salesStatus]}`}>
                        {BADGE_LABEL[d.salesStatus]}
                      </span>
                    )}
                  </div>
                </div>

                {d.inputStatus !== 'entered' ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[#8B94A7] text-sm">
                      {d.inputStatus === 'overdue' ? '期限を過ぎても入力されていません' : '今週のデータが未入力です'}
                    </p>
                    <button
                      onClick={() => router.push(`/weekly-input?storeId=${s.store.id}`)}
                      className="text-xs text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg px-3 py-1.5 hover:border-[#D4AF37]/60 transition"
                    >
                      入力する
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 売上数値 */}
                    <p className="text-[#E6ECF5] text-2xl font-bold mb-1">{`¥${d.sales!.toLocaleString('ja-JP')}`}</p>

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
                        <p className="text-[#8B94A7] text-xs mb-0.5">月次生産性（暫定）</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{formatMonthlyProductivity(d.monthlyProd)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${MONTHLY_PROD_BADGE_CLASS[d.monthlyProdStatus]}`}>
                          {MONTHLY_PROD_BADGE_LABEL[d.monthlyProdStatus]}
                        </span>
                      </div>
                    </div>

                    <button onClick={() => router.push(`/dashboard?storeId=${s.store.id}`)}
                      className="mt-3 text-sm text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg px-3 py-1.5 hover:border-[#D4AF37]/60 transition">
                      → 詳細を見る
                    </button>
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
