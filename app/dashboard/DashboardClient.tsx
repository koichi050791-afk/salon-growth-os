'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchDashboardData } from './actions'
import type { Store } from '@/lib/types/db'
import type { DashboardData, HistoryWeek } from './actions'

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function getSundayISO(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return sunday.toISOString().slice(0, 10)
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
const BADGE_LABEL: Record<BadgeStatus, string> = {
  good: '達成', warning: '注意', danger: '危険', none: 'データなし',
}

function fmtYen(val: number | null): string {
  if (val === null) return '—'
  return '¥' + val.toLocaleString('ja-JP')
}
function fmtNum(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}
function diffPctStr(current: number | null, prev: number | null): { text: string; up: boolean } | null {
  if (current === null || prev === null || prev === 0) return null
  const p = ((current - prev) / prev) * 100
  return { text: `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`, up: p >= 0 }
}

const INPUT_CLASS = 'w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50'
const LABEL_CLASS = 'block text-sm text-[#8B94A7] mb-1'

// ──────────────────────────────────────────────
// 内部カード（数値表示）
// ──────────────────────────────────────────────
function MetricInner({
  label, value, diff, target,
}: {
  label: string; value: string; diff: { text: string; up: boolean } | null; target: string | null
}) {
  return (
    <div className="bg-[#0B1220] rounded-xl p-3 border border-white/5">
      <p className="text-[#8B94A7] text-xs mb-1">{label}</p>
      <p className="text-[#E6ECF5] text-2xl font-bold tracking-tight">{value}</p>
      {diff ? (
        <p className={`text-xs mt-1 ${diff.up ? 'text-emerald-400' : 'text-red-400'}`}>{diff.up ? '↑' : '↓'} {diff.text}</p>
      ) : (
        <p className="text-xs mt-1 text-[#8B94A7]">-</p>
      )}
      {target && <p className="text-xs text-[#8B94A7] mt-0.5">目標 {target}</p>}
    </div>
  )
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function DashboardClient({
  stores, initialStoreId, hideStoreSelect = false,
}: {
  stores: Store[]; initialStoreId: string; hideStoreSelect?: boolean
}) {
  const router = useRouter()
  const [storeId, setStoreId] = useState(initialStoreId)
  const [weekStart, setWeekStart] = useState(getSundayISO())
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async (sid: string, week: string) => {
    if (!sid) return
    setFetching(true)
    const result = await fetchDashboardData(sid, week)
    setData(result)
    setFetching(false)
  }, [])

  useEffect(() => { loadData(storeId, weekStart) }, [storeId, weekStart, loadData])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStoreId(val)
    router.replace(val ? `/dashboard?storeId=${val}` : '/dashboard')
  }

  const weeklyTargetSales = data?.config?.target_sales != null ? Math.round(data.config.target_sales / 4.3) : null
  const weeklyTargetVisits = data?.config?.target_visits != null ? Math.round(data.config.target_visits / 4.3) : null
  const weeklyTargetUnitPrice = data?.config?.target_unit_price ?? null

  const sales = data?.thisWeek?.sales ?? null
  const visits = data?.thisWeek?.visits ?? null
  const unitPrice = sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = data?.lastWeek?.sales ?? null
  const prevVisits = data?.lastWeek?.visits ?? null
  const prevUnitPrice = prevSales !== null && (data?.lastWeek?.visits ?? 0) > 0 ? Math.round(prevSales / data!.lastWeek!.visits!) : null

  const salesStatus = getStatus(sales, weeklyTargetSales)
  const visitsStatus = getStatus(visits, weeklyTargetVisits)
  const unitPriceStatus = getStatus(unitPrice, weeklyTargetUnitPrice)

  const lastInput = data?.thisWeek?.updated_at ?? data?.thisWeek?.created_at ?? null

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
    achieved:   { border: 'border-emerald-500', color: 'text-emerald-400', title: '✅ 今週は目標達成です', desc: '今週の取り組みを継続しましょう。', action: '今週の取り組みを来週も継続する' },
    visits:     { border: 'border-red-500',     color: 'text-red-400',     title: '原因：客数不足',                   desc: '客数を増やす施策を優先してください。',     action: '仕上がり直後に口コミ案内をその場で送る' },
    unit_price: { border: 'border-yellow-500',  color: 'text-yellow-400',  title: '原因：客単価不足',                  desc: '客単価を上げる施策を優先してください。',   action: 'カラー前にケア提案を1回必ず入れる' },
    both:       { border: 'border-red-500',     color: 'text-red-400',     title: '原因：客数・客単価の両方が不足',      desc: 'どちらも改善が必要です。',               action: '施術中に次回来店時期を必ず口頭で伝える' },
    no_data:    null,
  }
  const causeConfig = CAUSE_CONFIG[cause]

  const staffCards = (data?.staffList ?? []).map((s) => {
    const thisInput = data?.thisWeekStaff.find((i) => i.staff_id === s.id) ?? null
    const lastInput2 = data?.lastWeekStaff.find((i) => i.staff_id === s.id) ?? null
    const staffSales = thisInput?.sales ?? null
    const staffVisits = thisInput?.visits ?? null
    const staffUnit = staffSales !== null && staffVisits !== null && staffVisits > 0 ? Math.round(staffSales / staffVisits) : null
    const prevStaffSales = lastInput2?.sales ?? null
    const salesDiff = staffSales !== null && prevStaffSales !== null && prevStaffSales > 0 ? ((staffSales - prevStaffSales) / prevStaffSales) * 100 : null
    const isAlert = salesDiff !== null && salesDiff <= -20
    return { s, staffSales, staffVisits, staffUnit, salesDiff, prevStaffSales, isAlert }
  })

  return (
    <div className="space-y-4">
      {/* 店舗・週選択 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
        {!hideStoreSelect && (
          <div>
            <label className={LABEL_CLASS}>店舗</label>
            <select value={storeId} onChange={handleStoreChange} className={INPUT_CLASS}>
              <option value="">-- 店舗を選択 --</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.store_name}</option>)}
            </select>
          </div>
        )}
        {hideStoreSelect && storeId && (
          <div>
            <p className="text-[#8B94A7] text-xs mb-0.5">店舗</p>
            <p className="text-[#E6ECF5] font-bold">{stores[0]?.store_name ?? ''}</p>
          </div>
        )}
        <div>
          <label className={LABEL_CLASS}>対象週（日曜日）</label>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={INPUT_CLASS} />
        </div>
      </div>

      {fetching && <div className="text-center text-[#8B94A7] py-10 text-sm">データを読み込み中...</div>}

      {!fetching && storeId && data && (
        <>
          {/* セクション1：今週のサマリー */}
          <div className={`bg-[#111A2B] rounded-2xl p-4 border border-white/5`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[#E6ECF5] text-lg font-semibold">📈 今週のサマリー</h2>
                {lastInput && (
                  <p className="text-[#8B94A7] text-xs mt-0.5">最終入力 <span className="text-[#E6ECF5] text-sm">{fmtDate(lastInput)}</span></p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${BADGE_CLASS[salesStatus]}`}>{BADGE_LABEL[salesStatus]}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricInner label="週売上" value={fmtYen(sales)} diff={diffPctStr(sales, prevSales)} target={weeklyTargetSales !== null ? `週目標 ${fmtYen(weeklyTargetSales)}` : null} />
              <MetricInner label="週客数" value={fmtNum(visits, '人')} diff={diffPctStr(visits, prevVisits)} target={weeklyTargetVisits !== null ? `週目標 ${fmtNum(weeklyTargetVisits, '人')}` : null} />
              <MetricInner label="客単価" value={fmtYen(unitPrice)} diff={diffPctStr(unitPrice, prevUnitPrice)} target={weeklyTargetUnitPrice !== null ? `目標 ${fmtYen(weeklyTargetUnitPrice)}` : null} />
            </div>
          </div>

          {/* セクション2：原因分解 */}
          {causeConfig && (
            <div className={`bg-[#111A2B] rounded-2xl p-4 border-l-4 ${causeConfig.border}`}>
              <h2 className="text-[#E6ECF5] text-lg font-semibold mb-2">📊 原因分解</h2>
              <p className={`text-xl font-bold mb-1 ${causeConfig.color}`}>{causeConfig.title}</p>
              <p className="text-[#8B94A7] text-sm">{causeConfig.desc}</p>
            </div>
          )}

          {/* セクション3：スタッフ別 */}
          {staffCards.length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-lg font-semibold mb-3">👤 スタッフ別</h2>
              {staffCards.map(({ s, staffSales, staffVisits, staffUnit, salesDiff, prevStaffSales, isAlert }) => (
                <div key={s.id} className={`bg-[#111A2B] rounded-2xl p-4 mb-3 border ${isAlert ? 'border-red-500/30' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#E6ECF5] font-bold">{s.name}</p>
                    {isAlert && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">⚠️ 先週より大きく下落</span>}
                  </div>
                  {staffSales === null && staffVisits === null ? (
                    <p className="text-[#8B94A7] text-sm">今週のデータがありません</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[#8B94A7] text-xs mb-1">週売上</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{fmtYen(staffSales)}</p>
                        {salesDiff !== null ? (
                          <p className={`text-xs mt-0.5 ${salesDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{salesDiff >= 0 ? '↑' : '↓'} {salesDiff >= 0 ? '+' : ''}{salesDiff.toFixed(1)}%</p>
                        ) : prevStaffSales === null ? (
                          <p className="text-[#8B94A7] text-xs mt-0.5">初回</p>
                        ) : null}
                      </div>
                      <div className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[#8B94A7] text-xs mb-1">週客数</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{fmtNum(staffVisits, '人')}</p>
                      </div>
                      <div className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[#8B94A7] text-xs mb-1">客単価</p>
                        <p className="text-[#E6ECF5] font-bold text-sm">{fmtYen(staffUnit)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* セクション4：今週やること */}
          {causeConfig && (
            <div className="bg-[#111A2B] rounded-2xl p-4 border-l-4 border-[#D4AF37]">
              <h2 className="text-[#E6ECF5] text-lg font-semibold mb-2">🎯 今週やること</h2>
              <p className="text-[#D4AF37] text-lg font-bold mb-1">{causeConfig.action}</p>
              <p className="text-[#8B94A7] text-sm">※ 今週はこの1つに集中してください</p>
            </div>
          )}

          {/* セクション5：過去4週の推移 */}
          <HistorySection history={data.history ?? []} />
        </>
      )}

      {!storeId && !fetching && (
        <div className="bg-[#111A2B] rounded-2xl py-12 border border-white/5 text-center text-[#8B94A7] text-sm">
          店舗を選択してください
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 過去4週履歴セクション
// ──────────────────────────────────────────────
function HistorySection({ history }: { history: HistoryWeek[] }) {
  const hasAny = history.some((h) => h.input !== null)
  if (!hasAny) return null

  function fmtWeekLabel(iso: string): string {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}週`
  }

  function fmtYenH(val: number | null): string {
    if (val === null) return '—'
    return '¥' + val.toLocaleString('ja-JP')
  }

  function fmtNumH(val: number | null, suffix = ''): string {
    if (val === null) return '—'
    return val.toLocaleString('ja-JP') + suffix
  }

  function salesTrend(curr: number | null, prev: number | null): 'up' | 'flat' | 'down' | null {
    if (curr === null || prev === null || prev === 0) return null
    const pct = (curr - prev) / prev
    if (pct > 0.05) return 'up'
    if (pct < -0.05) return 'down'
    return 'flat'
  }

  const ACTION_STATUS: Record<string, string> = {
    completed: '完了',
    skipped: 'スキップ',
    planned: '実行中',
    in_progress: '実行中',
  }
  const ACTION_STATUS_CLASS: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400',
    skipped: 'bg-white/5 text-[#8B94A7]',
    planned: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    in_progress: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  }

  return (
    <div>
      <h2 className="text-[#E6ECF5] text-lg font-semibold mb-3">📋 過去4週の推移</h2>
      {history.map((week, idx) => {
        const prevInput = history[idx + 1]?.input ?? null
        const trend = salesTrend(week.input?.sales ?? null, prevInput?.sales ?? null)
        const unitP = week.input?.sales != null && week.input?.visits != null && week.input.visits > 0
          ? Math.round(week.input.sales / week.input.visits) : null

        return (
          <div key={week.weekStart} className="bg-[#111A2B] rounded-2xl p-4 border border-[#1E293B] mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#8B94A7] text-xs">{fmtWeekLabel(week.weekStart)}</p>
              {trend === 'up' && <span className="text-emerald-500 text-sm font-bold">↑</span>}
              {trend === 'flat' && <span className="text-[#8B94A7] text-sm">→</span>}
              {trend === 'down' && <span className="text-red-500 text-sm font-bold">↓</span>}
            </div>

            {week.input === null ? (
              <p className="text-[#8B94A7] text-sm">データなし</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-[#8B94A7] text-xs mb-0.5">売上</p>
                    <p className="text-[#E6ECF5] font-bold text-sm">{fmtYenH(week.input.sales)}</p>
                  </div>
                  <div>
                    <p className="text-[#8B94A7] text-xs mb-0.5">客数</p>
                    <p className="text-[#E6ECF5] text-sm">{fmtNumH(week.input.visits, '人')}</p>
                  </div>
                  <div>
                    <p className="text-[#8B94A7] text-xs mb-0.5">客単価</p>
                    <p className="text-[#E6ECF5] text-sm">{fmtYenH(unitP)}</p>
                  </div>
                </div>
                {week.action && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[#D4AF37] text-sm mb-1">{week.action.action_title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_STATUS_CLASS[week.action.status]}`}>
                      {ACTION_STATUS[week.action.status] ?? week.action.status}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
