'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWeeklyData, saveWeeklyInputs, savePrevActionResult } from './actions'
import type { Store, WeeklyStoreInput, MonthlyConfig, ImprovementAction } from '@/lib/types/db'

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function getSundayISO(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return sunday.toISOString().slice(0, 10)
}

function toInt(s: string): number | null {
  if (!s.trim()) return null
  const n = parseInt(s.replace(/,/g, ''), 10)
  return isNaN(n) ? null : n
}

function toFloat(s: string): number | null {
  if (!s.trim()) return null
  const n = parseFloat(s)
  return isNaN(n) || n < 0 ? null : n
}

function unitPrice(sales: string, visits: string): string {
  const s = toInt(sales)
  const v = toInt(visits)
  if (s === null || v === null || v === 0) return '—'
  return '¥' + Math.round(s / v).toLocaleString('ja-JP')
}

// ──────────────────────────────────────────────
// 診断ロジック
// ──────────────────────────────────────────────
type DiagnosisStatus = 'ok' | 'warning' | 'danger'
type DiagnosisResult = { status: DiagnosisStatus; issue: string; action: string }

function runDiagnosis(
  sales: number | null,
  visits: number | null,
  nextVisitCount: number | null,
  availabilityScore: number | null,
  lastWeek: WeeklyStoreInput | null,
  config: MonthlyConfig | null,
): DiagnosisResult {
  const prevSales = lastWeek?.sales ?? null
  const prevVisits = lastWeek?.visits ?? null
  const prevNextVisit = lastWeek?.next_visit_count ?? null

  if (prevSales !== null && prevVisits !== null && sales !== null && visits !== null) {
    const salesDown = sales < prevSales
    const visitsDown = visits < prevVisits
    const unitP = visits > 0 ? sales / visits : null
    const prevUnitP = prevVisits > 0 ? prevSales / prevVisits : null

    if (salesDown && visitsDown) {
      return { status: 'danger', issue: '集客不足：売上と客数がともに減少', action: '仕上がり直後にその場でGoogleの口コミ投稿を案内する' }
    }
    if (!visitsDown && unitP !== null && prevUnitP !== null && unitP < prevUnitP) {
      return { status: 'warning', issue: '単価低下：客数は維持だが客単価が下落', action: 'カラー前にケア提案を1回必ず入れる' }
    }
    if (nextVisitCount !== null && visits > 0 && prevNextVisit !== null && prevVisits > 0) {
      if (nextVisitCount / visits < (prevNextVisit / prevVisits) * 0.9) {
        return { status: 'warning', issue: '再来率低下：次回予約率が前週より低下', action: '会計時の次回予約案内を徹底してください' }
      }
    }
  } else if (config?.target_sales != null && sales !== null) {
    const ratio = sales / (config.target_sales / 4.3)
    if (ratio < 0.7) return { status: 'danger', issue: '売上が目標の70%未満', action: '仕上がり直後にその場でGoogleの口コミ投稿を案内する' }
    if (ratio < 0.9) return { status: 'warning', issue: '売上が目標の70〜90%', action: 'カラー前にケア提案を1回必ず入れる' }
  }

  const weeklyTarget = config?.target_sales != null ? config.target_sales / 4.3 : 0
  const salesAchievementRate = weeklyTarget > 0 && sales !== null ? sales / weeklyTarget : 1

  if ((availabilityScore ?? 0) >= 4 && salesAchievementRate < 0.9) {
    return { status: 'warning', issue: '空き枠が多い：平日集客に余地あり', action: '平日限定クーポンをLINEで配信する' }
  }

  return { status: 'ok', issue: '順調：主要指標に大きな異常なし', action: '今週の取り組みを来週も継続する' }
}

// ──────────────────────────────────────────────
// バリデーション
// ──────────────────────────────────────────────
type StaffRow = { staff_id: string; name: string; sales: string; visits: string; labor_hours: string }

function validateForm(
  storeForm: StoreForm,
  staffRows: StaffRow[],
): Record<string, string> {
  const errs: Record<string, string> = {}
  const s = storeForm.sales.trim()
  const v = storeForm.visits.trim()

  if (!s && !v) {
    errs.noData = '少なくとも売上または客数を入力してください'
    return errs
  }

  if (s) {
    const n = Number(s)
    if (isNaN(n) || n <= 0) errs.sales = '売上は1以上の数値を入力してください'
  }

  if (v) {
    const n = Number(v)
    if (isNaN(n) || n <= 0 || !Number.isInteger(n)) errs.visits = '客数は1以上の整数を入力してください'
  }

  const nvc = storeForm.next_visit_count.trim()
  if (nvc) {
    const n = Number(nvc)
    if (isNaN(n) || n < 0 || !Number.isInteger(n)) errs.next_visit_count = '0以上の整数を入力してください'
  }

  const nc = storeForm.new_customers.trim()
  if (nc) {
    const n = Number(nc)
    if (isNaN(n) || n < 0 || !Number.isInteger(n)) errs.new_customers = '0以上の整数を入力してください'
  }

  const rc = storeForm.repeat_customers.trim()
  if (rc) {
    const n = Number(rc)
    if (isNaN(n) || n < 0 || !Number.isInteger(n)) errs.repeat_customers = '0以上の整数を入力してください'
  }

  if (storeForm.availability_score === null || storeForm.availability_score === undefined) {
    errs.availability_score = '空き状況を選択してください'
  }

  staffRows.forEach((row, idx) => {
    const rs = row.sales.trim()
    const rv = row.visits.trim()
    if (rs) {
      const n = Number(rs)
      if (isNaN(n) || n <= 0) errs[`staff_${idx}_sales`] = '売上は1以上の数値を入力してください'
    }
    if (rv) {
      const n = Number(rv)
      if (isNaN(n) || n <= 0 || !Number.isInteger(n)) errs[`staff_${idx}_visits`] = '客数は1以上の整数を入力してください'
    }
  })

  // 店舗売上とスタッフ売上合計の整合チェック
  if (s && staffRows.length > 0) {
    const storeSales = Number(s)
    const staffTotal = staffRows.reduce((sum, row) => {
      const n = Number(row.sales.trim())
      return sum + (isNaN(n) ? 0 : n)
    }, 0)
    if (!isNaN(storeSales) && storeSales > 0 && staffTotal > 0) {
      if (storeSales !== staffTotal) {
        errs.sales = `店舗売上（${storeSales.toLocaleString()}円）とスタッフ売上合計（${staffTotal.toLocaleString()}円）が一致しません`
      }
    }
  }

  return errs
}

// ──────────────────────────────────────────────
// 型・定数
// ──────────────────────────────────────────────
type StoreForm = {
  sales: string
  visits: string
  next_visit_count: string
  new_customers: string
  repeat_customers: string
  availability_score: number | null
  memo: string
  total_labor_hours: string
}

const EMPTY_STORE_FORM: StoreForm = {
  sales: '', visits: '', next_visit_count: '',
  new_customers: '', repeat_customers: '',
  availability_score: null, memo: '',
  total_labor_hours: '',
}

const AVAIL_LABELS = ['1 少ない', '2', '3 普通', '4', '5 多い']

const BASE_INPUT = 'w-full bg-[#0B1220] border text-white rounded-xl p-4 text-lg focus:outline-none placeholder:text-[#8B94A7]/50'
const LABEL_CLASS = 'block text-sm text-[#8B94A7] mb-1'

const RESULT_LABEL: Record<string, string> = {
  improved: '✅ 改善した',
  unchanged: '➡️ 変化なし',
  worsened: '⬇️ 悪化した',
}

function inputCls(errKey: string, errors: Record<string, string>): string {
  return `${BASE_INPUT} ${errors[errKey] ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#D4AF37]/50'}`
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────
export default function WeeklyInputForm({
  stores,
  initialStoreId,
  hideStoreSelect = false,
}: {
  stores: Store[]
  initialStoreId: string
  hideStoreSelect?: boolean
}) {
  const router = useRouter()
  const topRef = useRef<HTMLDivElement>(null)
  const [storeId, setStoreId] = useState(initialStoreId)
  const [weekStart, setWeekStart] = useState(getSundayISO())
  const [storeForm, setStoreForm] = useState<StoreForm>(EMPTY_STORE_FORM)
  const [staffRows, setStaffRows] = useState<StaffRow[]>([])
  const [lastWeekInput, setLastWeekInput] = useState<WeeklyStoreInput | null>(null)
  const [config, setConfig] = useState<MonthlyConfig | null>(null)
  const [prevAction, setPrevAction] = useState<ImprovementAction | null>(null)
  const [fetching, setFetching] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 前週アクション検証フォーム
  const [prevResultStatus, setPrevResultStatus] = useState<'improved' | 'unchanged' | 'worsened'>('improved')
  const [prevResultNote, setPrevResultNote] = useState('')
  const [prevNextDecision, setPrevNextDecision] = useState<'continue' | 'switch'>('continue')
  const [prevSaving, setPrevSaving] = useState(false)
  const [prevSaved, setPrevSaved] = useState(false)

  const loadData = useCallback(async (sid: string, week: string) => {
    if (!sid) return
    setFetching(true)
    setDiagnosis(null)
    setErrors({})
    setPrevSaved(false)
    const result = await fetchWeeklyData(sid, week)

    if (result.storeInput) {
      const d = result.storeInput
      setStoreForm({
        sales:              d.sales?.toString() ?? '',
        visits:             d.visits?.toString() ?? '',
        next_visit_count:   d.next_visit_count?.toString() ?? '',
        new_customers:      d.new_customers?.toString() ?? '',
        repeat_customers:   d.repeat_customers?.toString() ?? '',
        availability_score: d.availability_score ?? null,
        memo:               d.memo ?? '',
        total_labor_hours:  d.total_labor_hours?.toString() ?? '',
      })
    } else {
      setStoreForm(EMPTY_STORE_FORM)
    }

    setLastWeekInput(result.lastWeekInput)
    setConfig(result.config)
    setPrevAction(result.prevAction)
    setStaffRows(
      result.staff.map((s) => {
        const existing = result.staffInputs.find((i) => i.staff_id === s.id)
        return {
          staff_id: s.id,
          name: s.name,
          sales: existing?.sales?.toString() ?? '',
          visits: existing?.visits?.toString() ?? '',
          labor_hours: existing?.labor_hours?.toString() ?? '',
        }
      })
    )
    setFetching(false)
  }, [])

  useEffect(() => { loadData(storeId, weekStart) }, [storeId, weekStart, loadData])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStoreId(val)
    router.replace(val ? `/weekly-input?storeId=${val}` : '/weekly-input')
  }

  function updateStoreForm(field: keyof StoreForm, value: string | number | null) {
    setStoreForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as string]) setErrors((prev) => { const n = { ...prev }; delete n[field as string]; return n })
  }

  function updateStaffRow(index: number, field: 'sales' | 'visits' | 'labor_hours', value: string) {
    setStaffRows((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next })
    const errKey = `staff_${index}_${field}`
    if (errors[errKey]) setErrors((prev) => { const n = { ...prev }; delete n[errKey]; return n })
  }

  async function handleSave() {
    if (!storeId) return

    const errs = validateForm(storeForm, staffRows)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setErrors({})
    setSaveState('saving')

    const sales = toInt(storeForm.sales)
    const visits = toInt(storeForm.visits)
    const nextVisitCount = toInt(storeForm.next_visit_count)

    const storePayload = {
      store_id: storeId, week_start: weekStart, sales, visits,
      next_visit_count: nextVisitCount,
      new_customers: toInt(storeForm.new_customers),
      repeat_customers: toInt(storeForm.repeat_customers),
      availability_score: storeForm.availability_score,
      memo: storeForm.memo || null,
      total_labor_hours: toFloat(storeForm.total_labor_hours),
    }

    const staffPayloads = staffRows
      .filter((r) => {
        const s = toInt(r.sales)
        const v = toInt(r.visits)
        const h = toFloat(r.labor_hours)
        return (s !== null && s > 0) || (v !== null && v > 0) || (h !== null && h > 0)
      })
      .map((r) => ({
        store_id: storeId,
        staff_id: r.staff_id,
        week_start: weekStart,
        sales: toInt(r.sales),
        visits: toInt(r.visits),
        labor_hours: toFloat(r.labor_hours),
      }))

    const { error } = await saveWeeklyInputs(storePayload, staffPayloads)
    if (error) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    } else {
      setSaveState('success')
      const result = runDiagnosis(sales, visits, nextVisitCount, storeForm.availability_score, lastWeekInput, config)
      setDiagnosis(result)
      setTimeout(() => { topRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  async function handlePrevActionSave() {
    if (!prevAction) return
    setPrevSaving(true)
    await savePrevActionResult(prevAction.id, prevResultStatus, prevResultNote, prevNextDecision)
    setPrevSaving(false)
    setPrevSaved(true)
    setPrevAction(null)
  }

  const DIAG_BORDER = { ok: 'border-emerald-500', warning: 'border-yellow-500', danger: 'border-red-500' }
  const DIAG_TEXT   = { ok: 'text-emerald-400',   warning: 'text-yellow-400',   danger: 'text-red-400' }
  const DIAG_BADGE  = { ok: '✅ 順調',             warning: '⚠️ 注意',           danger: '🚨 要対応' }

  const showPrevVerify = prevAction && (prevAction.status === 'planned' || prevAction.status === 'in_progress') && !prevSaved

  return (
    <div className="space-y-4">
      <div ref={topRef} />

      {/* 前週アクション検証カード */}
      {showPrevVerify && (
        <div className="bg-[#111A2B] rounded-2xl p-4 border-l-4 border-[#D4AF37]">
          <p className="text-[#D4AF37] text-xs font-bold mb-1">📋 先週のアクション結果を記録</p>
          <p className="text-[#E6ECF5] text-base font-bold mb-3">{prevAction!.action_title}</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['improved', 'unchanged', 'worsened'] as const).map((v) => (
              <button key={v} onClick={() => setPrevResultStatus(v)}
                className={`py-2 rounded-xl text-xs font-bold transition ${prevResultStatus === v ? 'bg-[#D4AF37] text-black' : 'bg-[#0B1220] text-[#8B94A7] border border-white/10'}`}>
                {RESULT_LABEL[v]}
              </button>
            ))}
          </div>
          <textarea value={prevResultNote} onChange={(e) => setPrevResultNote(e.target.value)}
            placeholder="メモ（任意）" rows={2}
            className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 text-sm mb-3 focus:outline-none focus:border-[#D4AF37]/50 resize-none" />
          <div className="mb-3">
            <p className="text-[#8B94A7] text-xs mb-2">来週のアクション</p>
            <div className="grid grid-cols-2 gap-2">
              {(['continue', 'switch'] as const).map((v) => (
                <button key={v} onClick={() => setPrevNextDecision(v)}
                  className={`py-2 rounded-xl text-xs font-bold transition ${prevNextDecision === v ? 'bg-[#D4AF37] text-black' : 'bg-[#0B1220] text-[#8B94A7] border border-white/10'}`}>
                  {v === 'continue' ? '🔁 継続する' : '🔄 変更する'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handlePrevActionSave} disabled={prevSaving}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50">
            {prevSaving ? '保存中...' : '記録する'}
          </button>
        </div>
      )}

      {/* 診断カード（保存後に表示） */}
      {diagnosis && (
        <div className={`bg-[#111A2B] rounded-2xl p-5 border-l-4 ${DIAG_BORDER[diagnosis.status]}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-bold ${DIAG_TEXT[diagnosis.status]}`}>{DIAG_BADGE[diagnosis.status]}</span>
            <span className="text-[#8B94A7] text-xs">保存完了・診断結果</span>
          </div>
          <p className="text-[#E6ECF5] font-bold text-lg mb-2">{diagnosis.issue}</p>
          <p className="text-[#D4AF37] text-sm mb-4">{diagnosis.action}</p>
          <a href={`/actions/confirm?storeId=${storeId}`}
            className="inline-block text-sm px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:opacity-90 transition">
            🎯 改善アクションを決める →
          </a>
        </div>
      )}

      {/* 全体エラー */}
      {errors.noData && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-red-400 text-sm">{errors.noData}</p>
        </div>
      )}

      {/* 店舗・週選択 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
        {!hideStoreSelect ? (
          <div>
            <label className={LABEL_CLASS}>店舗</label>
            <select value={storeId} onChange={handleStoreChange}
              className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50">
              <option value="">-- 店舗を選択 --</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.store_name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <p className="text-[#8B94A7] text-xs mb-0.5">店舗</p>
            <p className="text-[#E6ECF5] font-bold">{stores[0]?.store_name ?? ''}</p>
          </div>
        )}
        <div>
          <label className={LABEL_CLASS}>対象週（日曜日）</label>
          <p className="text-[#8B94A7] text-xs mb-2">この週の日曜日を選択してください</p>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
            className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50" />
        </div>
      </div>

      {fetching && <div className="text-center text-[#8B94A7] py-8 text-sm">データを読み込み中...</div>}

      {!fetching && storeId && (
        <>
          {/* 店舗全体セクション */}
          <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
            <h2 className="text-[#E6ECF5] text-lg font-semibold mb-4">🏪 店舗全体</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>週売上（円）</label>
                <input type="number" inputMode="numeric" min="1" value={storeForm.sales}
                  onChange={(e) => updateStoreForm('sales', e.target.value)}
                  placeholder="例: 350000" className={inputCls('sales', errors)} />
                {errors.sales && <p className="text-red-400 text-xs mt-1">{errors.sales}</p>}
              </div>
              <div>
                <label className={LABEL_CLASS}>週客数（人）</label>
                <input type="number" inputMode="numeric" min="1" value={storeForm.visits}
                  onChange={(e) => updateStoreForm('visits', e.target.value)}
                  placeholder="例: 35" className={inputCls('visits', errors)} />
                {errors.visits && <p className="text-red-400 text-xs mt-1">{errors.visits}</p>}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm text-[#8B94A7]">客単価</label>
                  <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full px-2 py-0.5">自動算出</span>
                </div>
                <div className="bg-[#0B1220]/50 border border-white/5 rounded-xl p-4">
                  <span className="text-[#D4AF37] text-xl font-bold">{unitPrice(storeForm.sales, storeForm.visits)}</span>
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>次回予約件数（件）</label>
                <input type="number" inputMode="numeric" min="0" value={storeForm.next_visit_count}
                  onChange={(e) => updateStoreForm('next_visit_count', e.target.value)}
                  placeholder="例: 20" className={inputCls('next_visit_count', errors)} />
                {errors.next_visit_count && <p className="text-red-400 text-xs mt-1">{errors.next_visit_count}</p>}
              </div>
              <div>
                <label className={LABEL_CLASS}>新規客数（人）</label>
                <input type="number" inputMode="numeric" min="0" value={storeForm.new_customers}
                  onChange={(e) => updateStoreForm('new_customers', e.target.value)}
                  placeholder="例: 5" className={inputCls('new_customers', errors)} />
                {errors.new_customers && <p className="text-red-400 text-xs mt-1">{errors.new_customers}</p>}
              </div>
              <div>
                <label className={LABEL_CLASS}>再来客数（人）</label>
                <input type="number" inputMode="numeric" min="0" value={storeForm.repeat_customers}
                  onChange={(e) => updateStoreForm('repeat_customers', e.target.value)}
                  placeholder="例: 30" className={inputCls('repeat_customers', errors)} />
                {errors.repeat_customers && <p className="text-red-400 text-xs mt-1">{errors.repeat_customers}</p>}
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  空き状況<span className="text-red-400 text-xs ml-1">※必須</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAIL_LABELS.map((label, i) => {
                    const val = i + 1
                    const active = storeForm.availability_score === val
                    return (
                      <button key={val} type="button"
                        onClick={() => updateStoreForm('availability_score', active ? null : val)}
                        className={`py-3 text-sm font-medium rounded-lg transition active:scale-[0.98] ${active ? 'bg-[#D4AF37] text-black font-bold' : 'bg-[#0B1220] border border-white/10 text-[#8B94A7]'}`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
                {errors.availability_score && (
                  <p className="text-red-400 text-xs mt-1">{errors.availability_score}</p>
                )}
              </div>
              <div>
                <label className={LABEL_CLASS}>総労働時間（任意）</label>
                <p className="text-[#8B94A7] text-xs mb-2">スタッフ全員の合計稼働時間</p>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.1" min="0" value={storeForm.total_labor_hours}
                    onChange={(e) => updateStoreForm('total_labor_hours', e.target.value)}
                    placeholder="例：120.5"
                    className={`flex-1 ${BASE_INPUT} border-white/10 focus:border-[#D4AF37]/50`} />
                  <span className="text-[#8B94A7] text-sm whitespace-nowrap">時間</span>
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>メモ（任意）</label>
                <textarea value={storeForm.memo} onChange={(e) => updateStoreForm('memo', e.target.value)}
                  rows={3} placeholder="気づいたこと、特記事項など"
                  className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-4 text-lg focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#8B94A7]/50 resize-none" />
              </div>
            </div>
          </div>

          {/* スタッフ別セクション */}
          {staffRows.length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-lg font-semibold mb-3">👤 スタッフ別</h2>
              {staffRows.map((row, idx) => (
                <div key={row.staff_id} className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 mb-3">
                  <p className="text-[#E6ECF5] font-bold mb-3">{row.name}</p>
                  <div className="space-y-3">
                    <div>
                      <label className={LABEL_CLASS}>週売上（円）</label>
                      <input type="number" inputMode="numeric" min="1" value={row.sales}
                        onChange={(e) => updateStaffRow(idx, 'sales', e.target.value)}
                        placeholder="例: 80000" className={inputCls(`staff_${idx}_sales`, errors)} />
                      {errors[`staff_${idx}_sales`] && <p className="text-red-400 text-xs mt-1">{errors[`staff_${idx}_sales`]}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>週客数（人）</label>
                      <input type="number" inputMode="numeric" min="1" value={row.visits}
                        onChange={(e) => updateStaffRow(idx, 'visits', e.target.value)}
                        placeholder="例: 10" className={inputCls(`staff_${idx}_visits`, errors)} />
                      {errors[`staff_${idx}_visits`] && <p className="text-red-400 text-xs mt-1">{errors[`staff_${idx}_visits`]}</p>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm text-[#8B94A7]">客単価</label>
                        <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full px-2 py-0.5">自動算出</span>
                      </div>
                      <div className="bg-[#0B1220]/50 border border-white/5 rounded-xl p-4">
                        <span className="text-[#D4AF37] text-base font-bold">{unitPrice(row.sales, row.visits)}</span>
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>労働時間（任意）</label>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.1" min="0" value={row.labor_hours}
                          onChange={(e) => updateStaffRow(idx, 'labor_hours', e.target.value)}
                          placeholder="例：40.0"
                          className={`flex-1 ${BASE_INPUT} border-white/10 focus:border-[#D4AF37]/50`} />
                        <span className="text-[#8B94A7] text-sm whitespace-nowrap">時間</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 保存ボタン */}
          <button onClick={handleSave} disabled={saveState === 'saving'}
            className={`w-full rounded-xl py-5 text-lg font-bold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${
              saveState === 'success' ? 'bg-emerald-500 text-white'
              : saveState === 'error' ? 'bg-red-500 text-white'
              : 'bg-[#D4AF37] text-black'
            }`}>
            {saveState === 'saving' ? '保存中...' : saveState === 'success' ? '✅ 保存しました' : saveState === 'error' ? '❌ 保存に失敗しました' : 'まとめて保存'}
          </button>
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
