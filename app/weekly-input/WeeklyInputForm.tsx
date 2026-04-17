'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWeeklyData, saveWeeklyInputs } from './actions'
import type { Store } from '@/lib/types/db'

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

function unitPrice(sales: string, visits: string): string {
  const s = toInt(sales)
  const v = toInt(visits)
  if (s === null || v === null || v === 0) return '—'
  return '¥' + Math.round(s / v).toLocaleString('ja-JP')
}

// ──────────────────────────────────────────────
// 型
// ──────────────────────────────────────────────
type StoreForm = {
  sales: string
  visits: string
  next_visit_count: string
  new_customers: string
  repeat_customers: string
  availability_score: number | null
  memo: string
}

type StaffRow = {
  staff_id: string
  name: string
  sales: string
  visits: string
}

const EMPTY_STORE_FORM: StoreForm = {
  sales: '', visits: '', next_visit_count: '',
  new_customers: '', repeat_customers: '',
  availability_score: null, memo: '',
}

const AVAIL_LABELS = ['1 少ない', '2', '3 普通', '4', '5 多い']

const INPUT_CLASS =
  'w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 placeholder:text-slate-600'
const LABEL_CLASS = 'block text-sm text-slate-400 mb-1.5'

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
  const [storeId, setStoreId] = useState(initialStoreId)
  const [weekStart, setWeekStart] = useState(getSundayISO())
  const [storeForm, setStoreForm] = useState<StoreForm>(EMPTY_STORE_FORM)
  const [staffRows, setStaffRows] = useState<StaffRow[]>([])
  const [fetching, setFetching] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  const loadData = useCallback(async (sid: string, week: string) => {
    if (!sid) return
    setFetching(true)
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
      })
    } else {
      setStoreForm(EMPTY_STORE_FORM)
    }

    setStaffRows(
      result.staff.map((s) => {
        const existing = result.staffInputs.find((i) => i.staff_id === s.id)
        return {
          staff_id: s.id,
          name: s.name,
          sales:  existing?.sales?.toString()  ?? '',
          visits: existing?.visits?.toString() ?? '',
        }
      })
    )
    setFetching(false)
  }, [])

  useEffect(() => {
    loadData(storeId, weekStart)
  }, [storeId, weekStart, loadData])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStoreId(val)
    router.replace(val ? `/weekly-input?storeId=${val}` : '/weekly-input')
  }

  function updateStoreForm(field: keyof StoreForm, value: string | number | null) {
    setStoreForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateStaffRow(index: number, field: 'sales' | 'visits', value: string) {
    setStaffRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  async function handleSave() {
    if (!storeId) return
    setSaveState('saving')

    const storePayload = {
      store_id:           storeId,
      week_start:         weekStart,
      sales:              toInt(storeForm.sales),
      visits:             toInt(storeForm.visits),
      next_visit_count:   toInt(storeForm.next_visit_count),
      new_customers:      toInt(storeForm.new_customers),
      repeat_customers:   toInt(storeForm.repeat_customers),
      availability_score: storeForm.availability_score,
      memo:               storeForm.memo || null,
    }

    const staffPayloads = staffRows
      .filter((r) => r.sales !== '' || r.visits !== '')
      .map((r) => ({
        store_id:   storeId,
        staff_id:   r.staff_id,
        week_start: weekStart,
        sales:      toInt(r.sales),
        visits:     toInt(r.visits),
      }))

    const { error } = await saveWeeklyInputs(storePayload, staffPayloads)
    if (error) {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    } else {
      setSaveState('success')
      setTimeout(() => setSaveState('idle'), 2000)
    }
  }

  return (
    <div>
      {/* 店舗・週選択 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5 mb-4 space-y-3">
        {!hideStoreSelect ? (
          <div>
            <label className={LABEL_CLASS}>店舗</label>
            <select value={storeId} onChange={handleStoreChange} className={INPUT_CLASS}>
              <option value="">-- 店舗を選択 --</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <p className="text-slate-500 text-xs mb-0.5">店舗</p>
            <p className="text-white font-bold">{stores[0]?.store_name ?? ''}</p>
          </div>
        )}
        <div>
          <label className={LABEL_CLASS}>対象週（日曜日）</label>
          <input type="date" value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)} className={INPUT_CLASS} />
        </div>
      </div>

      {fetching && (
        <div className="text-center text-slate-500 py-8 text-sm">データを読み込み中...</div>
      )}

      {!fetching && storeId && (
        <>
          {/* 店舗全体セクション */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5 mb-4">
            <h2 className="text-white text-lg font-bold mb-4">🏪 店舗全体</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>週売上（円）</label>
                <input type="number" value={storeForm.sales}
                  onChange={(e) => updateStoreForm('sales', e.target.value)}
                  placeholder="例: 350000" className={INPUT_CLASS} min="0" />
              </div>

              <div>
                <label className={LABEL_CLASS}>週客数（人）</label>
                <input type="number" value={storeForm.visits}
                  onChange={(e) => updateStoreForm('visits', e.target.value)}
                  placeholder="例: 35" className={INPUT_CLASS} min="0" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm text-slate-400">客単価</label>
                  <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">自動算出</span>
                </div>
                <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3">
                  <span className="text-amber-300 text-lg font-bold">
                    {unitPrice(storeForm.sales, storeForm.visits)}
                  </span>
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>次回予約件数（件）</label>
                <input type="number" value={storeForm.next_visit_count}
                  onChange={(e) => updateStoreForm('next_visit_count', e.target.value)}
                  placeholder="例: 20" className={INPUT_CLASS} min="0" />
              </div>

              <div>
                <label className={LABEL_CLASS}>新規客数（人）</label>
                <input type="number" value={storeForm.new_customers}
                  onChange={(e) => updateStoreForm('new_customers', e.target.value)}
                  placeholder="例: 5" className={INPUT_CLASS} min="0" />
              </div>

              <div>
                <label className={LABEL_CLASS}>再来客数（人）</label>
                <input type="number" value={storeForm.repeat_customers}
                  onChange={(e) => updateStoreForm('repeat_customers', e.target.value)}
                  placeholder="例: 30" className={INPUT_CLASS} min="0" />
              </div>

              <div>
                <label className={LABEL_CLASS}>空き状況</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAIL_LABELS.map((label, i) => {
                    const val = i + 1
                    const active = storeForm.availability_score === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => updateStoreForm('availability_score', active ? null : val)}
                        className={`py-3 text-sm font-medium rounded-lg transition active:scale-[0.98] ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>メモ（任意）</label>
                <textarea
                  value={storeForm.memo}
                  onChange={(e) => updateStoreForm('memo', e.target.value)}
                  rows={3}
                  placeholder="気づいたこと、特記事項など"
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* スタッフ別セクション */}
          {staffRows.length > 0 && (
            <div className="mb-4">
              <h2 className="text-white text-lg font-bold mb-3">👤 スタッフ別</h2>
              {staffRows.map((row, idx) => (
                <div key={row.staff_id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-4 mb-3">
                  <p className="text-white font-bold mb-3">{row.name}</p>
                  <div className="space-y-3">
                    <div>
                      <label className={LABEL_CLASS}>週売上（円）</label>
                      <input type="number" value={row.sales}
                        onChange={(e) => updateStaffRow(idx, 'sales', e.target.value)}
                        placeholder="例: 80000" className={INPUT_CLASS} min="0" />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>週客数（人）</label>
                      <input type="number" value={row.visits}
                        onChange={(e) => updateStaffRow(idx, 'visits', e.target.value)}
                        placeholder="例: 10" className={INPUT_CLASS} min="0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-sm text-slate-400">客単価</label>
                        <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">自動算出</span>
                      </div>
                      <div className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3">
                        <span className="text-amber-300 text-base font-bold">
                          {unitPrice(row.sales, row.visits)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={`w-full rounded-xl py-5 text-xl font-bold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 ${
              saveState === 'success' ? 'bg-green-600'
              : saveState === 'error' ? 'bg-red-600'
              : 'bg-gradient-to-r from-blue-600 to-blue-500'
            }`}
          >
            {saveState === 'saving'  ? '保存中...'
            : saveState === 'success' ? '✅ 保存しました'
            : saveState === 'error'   ? '❌ 保存に失敗しました'
            : 'まとめて保存'}
          </button>
        </>
      )}

      {!storeId && !fetching && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl py-12 text-center text-slate-500 text-sm">
          店舗を選択してください
        </div>
      )}
    </div>
  )
}
