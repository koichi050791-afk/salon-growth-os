'use client'

import { useState, useCallback } from 'react'
import { saveMonthlyReport, submitMonthlyReport, fetchMonthlyReport } from './actions'
import type { MonthlyReport } from '@/lib/types/db'
import type { ReportFormData } from './actions'

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────
function makeEmptyReport(storeId: string, yearMonth: string): MonthlyReport {
  const now = new Date().toISOString()
  return {
    id: '',
    store_id: storeId,
    year_month: `${yearMonth}-01`,
    staff_count: null,
    total_sales: null,
    tech_sales: null,
    retail_sales: null,
    tech_unit_price: null,
    tech_customer_count: null,
    new_customer_count: null,
    discount_rate: null,
    last_year_total_sales: null,
    last_year_tech_sales: null,
    last_year_retail_sales: null,
    target_total_sales: null,
    target_tech_sales: null,
    target_retail_sales: null,
    color_count: null,
    perm_count: null,
    straight_count: null,
    treatment_count: null,
    spa_count: null,
    machine_count: null,
    new_customer_visit: null,
    new_customer_repeat: null,
    new_repeat_rate: null,
    existing_customer_visit: null,
    existing_customer_repeat: null,
    existing_repeat_rate: null,
    repeat_rate_3m: null,
    repeat_rate_6m: null,
    adopted_actions: [],
    promoted_staff: null,
    product_requests: null,
    notes: null,
    submitted_by: null,
    submitted_at: null,
    created_at: now,
    updated_at: now,
  }
}


function toInt(s: string): number | null {
  if (!s.trim()) return null
  const n = parseInt(s.replace(/,/g, ''), 10)
  return isNaN(n) ? null : n
}

function toFloat(s: string): number | null {
  if (!s.trim()) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function fmtYen(val: number | null): string {
  if (val === null) return '—'
  return '¥' + val.toLocaleString('ja-JP')
}

function calcPct(numerator: number | null, denominator: number | null): string {
  if (!numerator || !denominator || denominator === 0) return '—'
  return (Math.round((numerator / denominator) * 1000) / 10).toFixed(1) + '%'
}

function calcYoY(current: number | null, last: number | null): string {
  if (!current || !last || last === 0) return '—'
  const pct = ((current - last) / last) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

function calcUnitPrice(sales: string, count: string): string {
  const s = toInt(sales)
  const c = toInt(count)
  if (!s || !c || c === 0) return '—'
  return '¥' + Math.round(s / c).toLocaleString('ja-JP')
}

// 'YYYY-MM-DD' → 'YYYY年MM月'
function fmtYearMonth(yearMonthDate: string): string {
  const [y, m] = yearMonthDate.split('-')
  return `${y}年${parseInt(m, 10)}月`
}

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────
const BASE_INPUT =
  'w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50'
const LABEL = 'block text-sm text-[#8B94A7] mb-1'
const COMPUTED_BOX = 'bg-[#0B1220]/50 border border-white/5 rounded-xl p-3'

function numInput(
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  opts: { step?: string; min?: string } = {}
) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={opts.step}
      min={opts.min ?? '0'}
      className={BASE_INPUT}
    />
  )
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────
type Props = {
  initialReport: MonthlyReport
  storeName: string
  storeId: string
  yearMonth: string  // 'YYYY-MM'
  isReadOnly: boolean
}

type FormState = {
  staff_count: string
  total_sales: string
  tech_sales: string
  retail_sales: string
  tech_customer_count: string
  new_customer_count: string
  discount_rate: string
  last_year_total_sales: string
  last_year_tech_sales: string
  last_year_retail_sales: string
  target_total_sales: string
  target_tech_sales: string
  target_retail_sales: string
  color_count: string
  perm_count: string
  straight_count: string
  treatment_count: string
  spa_count: string
  machine_count: string
  new_customer_visit: string
  new_customer_repeat: string
  existing_customer_visit: string
  existing_customer_repeat: string
  repeat_rate_3m: string
  repeat_rate_6m: string
  promoted_staff: string
  product_requests: string
  notes: string
}

function reportToForm(r: MonthlyReport): FormState {
  const n = (v: number | null) => (v === null ? '' : String(v))
  const s = (v: string | null) => v ?? ''
  return {
    staff_count: n(r.staff_count),
    total_sales: n(r.total_sales),
    tech_sales: n(r.tech_sales),
    retail_sales: n(r.retail_sales),
    tech_customer_count: n(r.tech_customer_count),
    new_customer_count: n(r.new_customer_count),
    discount_rate: n(r.discount_rate),
    last_year_total_sales: n(r.last_year_total_sales),
    last_year_tech_sales: n(r.last_year_tech_sales),
    last_year_retail_sales: n(r.last_year_retail_sales),
    target_total_sales: n(r.target_total_sales),
    target_tech_sales: n(r.target_tech_sales),
    target_retail_sales: n(r.target_retail_sales),
    color_count: n(r.color_count),
    perm_count: n(r.perm_count),
    straight_count: n(r.straight_count),
    treatment_count: n(r.treatment_count),
    spa_count: n(r.spa_count),
    machine_count: n(r.machine_count),
    new_customer_visit: n(r.new_customer_visit),
    new_customer_repeat: n(r.new_customer_repeat),
    existing_customer_visit: n(r.existing_customer_visit),
    existing_customer_repeat: n(r.existing_customer_repeat),
    repeat_rate_3m: n(r.repeat_rate_3m),
    repeat_rate_6m: n(r.repeat_rate_6m),
    promoted_staff: s(r.promoted_staff),
    product_requests: s(r.product_requests),
    notes: s(r.notes),
  }
}

function formToPayload(f: FormState): ReportFormData {
  const n = (s: string) => toInt(s)
  const fl = (s: string) => toFloat(s)
  const tx = (s: string) => s.trim() || null
  return {
    staff_count: n(f.staff_count),
    total_sales: n(f.total_sales),
    tech_sales: n(f.tech_sales),
    retail_sales: n(f.retail_sales),
    tech_customer_count: n(f.tech_customer_count),
    new_customer_count: n(f.new_customer_count),
    discount_rate: fl(f.discount_rate),
    last_year_total_sales: n(f.last_year_total_sales),
    last_year_tech_sales: n(f.last_year_tech_sales),
    last_year_retail_sales: n(f.last_year_retail_sales),
    target_total_sales: n(f.target_total_sales),
    target_tech_sales: n(f.target_tech_sales),
    target_retail_sales: n(f.target_retail_sales),
    color_count: n(f.color_count),
    perm_count: n(f.perm_count),
    straight_count: n(f.straight_count),
    treatment_count: n(f.treatment_count),
    spa_count: n(f.spa_count),
    machine_count: n(f.machine_count),
    new_customer_visit: n(f.new_customer_visit),
    new_customer_repeat: n(f.new_customer_repeat),
    existing_customer_visit: n(f.existing_customer_visit),
    existing_customer_repeat: n(f.existing_customer_repeat),
    repeat_rate_3m: fl(f.repeat_rate_3m),
    repeat_rate_6m: fl(f.repeat_rate_6m),
    promoted_staff: tx(f.promoted_staff),
    product_requests: tx(f.product_requests),
    notes: tx(f.notes),
  }
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function MonthlyReportForm({
  initialReport,
  storeName,
  storeId,
  yearMonth,
  isReadOnly,
}: Props) {
  const [report, setReport] = useState(initialReport)
  const [form, setForm] = useState<FormState>(() => reportToForm(initialReport))
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [currentYearMonth, setCurrentYearMonth] = useState(yearMonth)
  const [loadingMonth, setLoadingMonth] = useState(false)

  const isSubmitted = !!report.submitted_at
  const disabled = isReadOnly || isSubmitted

  function set(field: keyof FormState) {
    return (v: string) => setForm((prev) => ({ ...prev, [field]: v }))
  }

  async function handleMonthChange(newYearMonth: string) {
    setCurrentYearMonth(newYearMonth)
    setLoadingMonth(true)
    const { report: newReport } = await fetchMonthlyReport(storeId, newYearMonth)
    const r = newReport ?? makeEmptyReport(storeId, newYearMonth)
    setReport(r)
    setForm(reportToForm(r))
    setLoadingMonth(false)
  }

  const handleSave = useCallback(async () => {
    setSaveState('saving')
    const { reportId: savedId, error } = await saveMonthlyReport(
      report.id, storeId, currentYearMonth, formToPayload(form)
    )
    if (error) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    } else {
      setSaveState('success')
      if (!report.id && savedId) {
        setReport((prev) => ({ ...prev, id: savedId }))
      }
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [report.id, storeId, currentYearMonth, form])

  const handleSubmit = useCallback(async () => {
    if (!confirm('提出すると編集できなくなります。提出しますか？')) return
    setSubmitState('saving')
    const { reportId: savedId, error: saveError } = await saveMonthlyReport(
      report.id, storeId, currentYearMonth, formToPayload(form)
    )
    if (saveError || !savedId) {
      setSubmitState('error')
      setTimeout(() => setSubmitState('idle'), 3000)
      return
    }
    if (!report.id) {
      setReport((prev) => ({ ...prev, id: savedId }))
    }
    const { error } = await submitMonthlyReport(savedId)
    if (error) {
      setSubmitState('error')
      setTimeout(() => setSubmitState('idle'), 3000)
    } else {
      setSubmitState('done')
      setReport((prev) => ({ ...prev, submitted_at: new Date().toISOString() }))
    }
  }, [report.id, storeId, currentYearMonth, form])

  // 自動算出値
  const techUnitPrice = calcUnitPrice(form.tech_sales, form.tech_customer_count)
  const retailRatio = calcPct(toInt(form.retail_sales), toInt(form.total_sales))
  const yoyTotal = calcYoY(toInt(form.total_sales), toInt(form.last_year_total_sales))
  const yoyTech = calcYoY(toInt(form.tech_sales), toInt(form.last_year_tech_sales))
  const yoyRetail = calcYoY(toInt(form.retail_sales), toInt(form.last_year_retail_sales))
  const achieveTotal = calcPct(toInt(form.total_sales), toInt(form.target_total_sales))
  const achieveTech = calcPct(toInt(form.tech_sales), toInt(form.target_tech_sales))
  const achieveRetail = calcPct(toInt(form.retail_sales), toInt(form.target_retail_sales))
  const newRepeatRate = calcPct(toInt(form.new_customer_repeat), toInt(form.new_customer_visit))
  const existingRepeatRate = calcPct(
    toInt(form.existing_customer_repeat),
    toInt(form.existing_customer_visit)
  )

  return (
    <div className="space-y-4">
      {/* ヘッダー情報 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
        <div>
          <p className="text-[#8B94A7] text-xs mb-0.5">店舗</p>
          <p className="text-[#E6ECF5] font-bold">{storeName}</p>
        </div>
        <div>
          <label className={LABEL}>対象月</label>
          <input
            type="month"
            value={currentYearMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={BASE_INPUT}
          />
        </div>
        {isSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-400 text-sm font-bold">✅ 提出済み</p>
            <p className="text-[#8B94A7] text-xs mt-0.5">
              {new Date(report.submitted_at!).toLocaleString('ja-JP')}
            </p>
          </div>
        )}
      </div>

      {loadingMonth && (
        <div className="text-center text-[#8B94A7] py-6 text-sm">読み込み中...</div>
      )}

      {!loadingMonth && (
        <>
          {/* ── 基本情報 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">👥 基本情報</h2>
            <div>
              <label className={LABEL}>在籍スタッフ数（人）</label>
              {numInput(form.staff_count, set('staff_count'), '例: 5', { min: '1' })}
            </div>
          </section>

          {/* ── 売上実績 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">💰 売上実績</h2>

            <div>
              <label className={LABEL}>総売上（円）</label>
              {numInput(form.total_sales, set('total_sales'), '例: 3500000')}
            </div>
            <div>
              <label className={LABEL}>技術売上（円）</label>
              {numInput(form.tech_sales, set('tech_sales'), '例: 3000000')}
            </div>
            <div>
              <label className={LABEL}>物販売上（円）</label>
              {numInput(form.retail_sales, set('retail_sales'), '例: 500000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">物販比率</span>
                <span className="text-[#D4AF37] text-sm font-bold">{retailRatio}</span>
              </div>
            </div>
            <div>
              <label className={LABEL}>技術客数（人）</label>
              {numInput(form.tech_customer_count, set('tech_customer_count'), '例: 200')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">技術客単価</span>
                <span className="text-[#D4AF37] text-sm font-bold">{techUnitPrice}</span>
              </div>
            </div>
            <div>
              <label className={LABEL}>新規客数（人）</label>
              {numInput(form.new_customer_count, set('new_customer_count'), '例: 30')}
            </div>
            <div>
              <label className={LABEL}>値引き率（%）</label>
              {numInput(form.discount_rate, set('discount_rate'), '例: 3.5', { step: '0.1' })}
            </div>
          </section>

          {/* ── 昨年実績 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">📅 昨年実績（前年同月）</h2>

            <div>
              <label className={LABEL}>昨年総売上（円）</label>
              {numInput(form.last_year_total_sales, set('last_year_total_sales'), '例: 3200000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">総売上 前年比</span>
                <span
                  className={`text-sm font-bold ${
                    yoyTotal.startsWith('+') ? 'text-emerald-400' : yoyTotal === '—' ? 'text-[#8B94A7]' : 'text-red-400'
                  }`}
                >
                  {yoyTotal}
                </span>
              </div>
            </div>
            <div>
              <label className={LABEL}>昨年技術売上（円）</label>
              {numInput(form.last_year_tech_sales, set('last_year_tech_sales'), '例: 2700000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">技術売上 前年比</span>
                <span
                  className={`text-sm font-bold ${
                    yoyTech.startsWith('+') ? 'text-emerald-400' : yoyTech === '—' ? 'text-[#8B94A7]' : 'text-red-400'
                  }`}
                >
                  {yoyTech}
                </span>
              </div>
            </div>
            <div>
              <label className={LABEL}>昨年物販売上（円）</label>
              {numInput(form.last_year_retail_sales, set('last_year_retail_sales'), '例: 500000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">物販売上 前年比</span>
                <span
                  className={`text-sm font-bold ${
                    yoyRetail.startsWith('+') ? 'text-emerald-400' : yoyRetail === '—' ? 'text-[#8B94A7]' : 'text-red-400'
                  }`}
                >
                  {yoyRetail}
                </span>
              </div>
            </div>
          </section>

          {/* ── 月次目標 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">🎯 月次目標</h2>

            <div>
              <label className={LABEL}>目標総売上（円）</label>
              {numInput(form.target_total_sales, set('target_total_sales'), '例: 3600000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">総売上 目標達成率</span>
                <span
                  className={`text-sm font-bold ${
                    parseFloat(achieveTotal) >= 100
                      ? 'text-emerald-400'
                      : parseFloat(achieveTotal) >= 90
                      ? 'text-amber-400'
                      : achieveTotal === '—'
                      ? 'text-[#8B94A7]'
                      : 'text-red-400'
                  }`}
                >
                  {achieveTotal}
                </span>
              </div>
            </div>
            <div>
              <label className={LABEL}>目標技術売上（円）</label>
              {numInput(form.target_tech_sales, set('target_tech_sales'), '例: 3100000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">技術売上 目標達成率</span>
                <span
                  className={`text-sm font-bold ${
                    parseFloat(achieveTech) >= 100
                      ? 'text-emerald-400'
                      : parseFloat(achieveTech) >= 90
                      ? 'text-amber-400'
                      : achieveTech === '—'
                      ? 'text-[#8B94A7]'
                      : 'text-red-400'
                  }`}
                >
                  {achieveTech}
                </span>
              </div>
            </div>
            <div>
              <label className={LABEL}>目標物販売上（円）</label>
              {numInput(form.target_retail_sales, set('target_retail_sales'), '例: 500000')}
              <div className={`${COMPUTED_BOX} mt-2 flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">物販売上 目標達成率</span>
                <span
                  className={`text-sm font-bold ${
                    parseFloat(achieveRetail) >= 100
                      ? 'text-emerald-400'
                      : parseFloat(achieveRetail) >= 90
                      ? 'text-amber-400'
                      : achieveRetail === '—'
                      ? 'text-[#8B94A7]'
                      : 'text-red-400'
                  }`}
                >
                  {achieveRetail}
                </span>
              </div>
            </div>
          </section>

          {/* ── メニュー別件数 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">✂️ メニュー別件数</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['color_count', 'カラー'],
                  ['perm_count', 'パーマ'],
                  ['straight_count', '縮毛矯正'],
                  ['treatment_count', 'トリートメント'],
                  ['spa_count', 'ヘッドスパ'],
                  ['machine_count', '機器系'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className={LABEL}>{label}（件）</label>
                  {numInput(form[field], set(field), '0')}
                </div>
              ))}
            </div>
          </section>

          {/* ── リピート率 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-4">
            <h2 className="text-[#E6ECF5] text-base font-semibold">🔄 リピート率</h2>

            <div className="space-y-3">
              <h3 className="text-[#8B94A7] text-xs font-semibold uppercase tracking-wide">
                新規客
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>来店数（人）</label>
                  {numInput(form.new_customer_visit, set('new_customer_visit'), '例: 30')}
                </div>
                <div>
                  <label className={LABEL}>再来店数（人）</label>
                  {numInput(form.new_customer_repeat, set('new_customer_repeat'), '例: 12')}
                </div>
              </div>
              <div className={`${COMPUTED_BOX} flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">新規リピート率</span>
                <span className="text-[#D4AF37] text-sm font-bold">{newRepeatRate}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[#8B94A7] text-xs font-semibold uppercase tracking-wide">
                既存客
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>来店数（人）</label>
                  {numInput(
                    form.existing_customer_visit,
                    set('existing_customer_visit'),
                    '例: 170'
                  )}
                </div>
                <div>
                  <label className={LABEL}>再来店数（人）</label>
                  {numInput(
                    form.existing_customer_repeat,
                    set('existing_customer_repeat'),
                    '例: 130'
                  )}
                </div>
              </div>
              <div className={`${COMPUTED_BOX} flex justify-between`}>
                <span className="text-[#8B94A7] text-xs">既存リピート率</span>
                <span className="text-[#D4AF37] text-sm font-bold">{existingRepeatRate}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[#8B94A7] text-xs font-semibold uppercase tracking-wide">
                期間別リピート率
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>3ヶ月リピート率（%）</label>
                  {numInput(form.repeat_rate_3m, set('repeat_rate_3m'), '例: 65.5', {
                    step: '0.1',
                  })}
                </div>
                <div>
                  <label className={LABEL}>6ヶ月リピート率（%）</label>
                  {numInput(form.repeat_rate_6m, set('repeat_rate_6m'), '例: 78.2', {
                    step: '0.1',
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── 定性情報 ── */}
          <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 space-y-3">
            <h2 className="text-[#E6ECF5] text-base font-semibold">📝 定性情報</h2>

            <div>
              <label className={LABEL}>昇進・異動スタッフ（任意）</label>
              <input
                type="text"
                value={form.promoted_staff}
                onChange={(e) => set('promoted_staff')(e.target.value)}
                placeholder="例: 山田→副店長昇格"
                className={BASE_INPUT}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={LABEL}>商品リクエスト・要望（任意）</label>
              <textarea
                value={form.product_requests}
                onChange={(e) => set('product_requests')(e.target.value)}
                placeholder="お客様からの要望など"
                rows={2}
                disabled={disabled}
                className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50 resize-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className={LABEL}>所見・特記事項（任意）</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes')(e.target.value)}
                placeholder="今月の振り返り、来月の取り組みなど"
                rows={4}
                disabled={disabled}
                className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50 resize-none disabled:opacity-50"
              />
            </div>
          </section>

          {/* ── ボタン ── */}
          {!disabled && (
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saveState === 'saving'}
                className={`w-full rounded-xl py-4 text-base font-bold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${
                  saveState === 'success'
                    ? 'bg-emerald-500 text-white'
                    : saveState === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#111A2B] border border-[#D4AF37]/50 text-[#D4AF37]'
                }`}
              >
                {saveState === 'saving'
                  ? '保存中...'
                  : saveState === 'success'
                  ? '✅ 下書き保存しました'
                  : saveState === 'error'
                  ? '❌ 保存に失敗しました'
                  : '💾 下書き保存'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === 'saving' || submitState === 'done'}
                className={`w-full rounded-xl py-4 text-base font-bold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${
                  submitState === 'done'
                    ? 'bg-emerald-500 text-white'
                    : submitState === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#D4AF37] text-black'
                }`}
              >
                {submitState === 'saving'
                  ? '提出中...'
                  : submitState === 'done'
                  ? '✅ 提出完了'
                  : submitState === 'error'
                  ? '❌ 提出に失敗しました'
                  : '📤 提出する'}
              </button>
            </div>
          )}

          {disabled && !isSubmitted && (
            <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-sm">閲覧専用モードです</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
