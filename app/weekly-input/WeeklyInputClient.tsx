'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveWeeklyRecord, type SaveWeeklyState } from './actions'
import type { Store } from '@/lib/types/db'

const initialState: SaveWeeklyState = { message: '', success: false }

function getMondayISO(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function getCurrentWeekMonday(): string {
  return getMondayISO(new Date().toISOString().slice(0, 10))
}

const INPUT_CLASS = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
const LABEL_CLASS = "block text-sm text-gray-400 mb-2"

export default function WeeklyInputClient({
  stores,
  selectedStoreId,
}: {
  stores: Store[]
  selectedStoreId: string
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(saveWeeklyRecord, initialState)

  const [sales, setSales] = useState('')
  const [visits, setVisits] = useState('')

  const unitPrice =
    sales !== '' && visits !== '' && Number(visits) > 0
      ? Math.round(Number(sales) / Number(visits))
      : null

  useEffect(() => {
    if (state.success) {
      setSales('')
      setVisits('')
    }
  }, [state])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/weekly-input?storeId=${e.target.value}`)
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="store_id" value={selectedStoreId} />

      {/* 店舗選択 */}
      <div>
        <label className={LABEL_CLASS}>店舗 <span className="text-red-400">*</span></label>
        <select
          value={selectedStoreId}
          onChange={handleStoreChange}
          className={INPUT_CLASS}
        >
          <option value="">店舗を選択</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.store_name}</option>
          ))}
        </select>
      </div>

      {/* 対象週 */}
      <div>
        <label className={LABEL_CLASS}>対象週 <span className="text-red-400">*</span></label>
        <input
          type="date"
          name="week_date"
          defaultValue={getCurrentWeekMonday()}
          required
          className={INPUT_CLASS}
        />
        <p className="mt-1.5 text-xs text-gray-600">選択した日付の週（月曜日始まり）として保存します</p>
      </div>

      {/* 売上 */}
      <div>
        <label className={LABEL_CLASS}>売上（円） <span className="text-red-400">*</span></label>
        <input
          type="number"
          name="sales"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          min="0"
          step="1"
          placeholder="例: 350000"
          required
          className={INPUT_CLASS}
        />
      </div>

      {/* 客数 */}
      <div>
        <label className={LABEL_CLASS}>客数（人） <span className="text-red-400">*</span></label>
        <input
          type="number"
          name="visits"
          value={visits}
          onChange={(e) => setVisits(e.target.value)}
          min="0"
          step="1"
          placeholder="例: 35"
          required
          className={INPUT_CLASS}
        />
      </div>

      {/* 客単価（自動算出） */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-gray-400">客単価</label>
          <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">自動算出</span>
        </div>
        <div className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-4">
          <span className="text-blue-400 text-xl font-bold">
            {unitPrice !== null ? `${unitPrice.toLocaleString('ja-JP')} 円` : '—'}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-600">売上 ÷ 客数で自動計算されます</p>
      </div>

      {/* 次回予約率 */}
      <div>
        <label className={LABEL_CLASS}>次回予約率（%）</label>
        <input
          type="number"
          name="repeat_rate"
          min="0"
          max="100"
          step="0.1"
          placeholder="例: 65.5"
          className={INPUT_CLASS}
        />
      </div>

      {/* 口コミ数 */}
      <div>
        <label className={LABEL_CLASS}>口コミ数（件）</label>
        <input
          type="number"
          name="review_count"
          min="0"
          step="1"
          placeholder="例: 3"
          className={INPUT_CLASS}
        />
      </div>

      {/* フィードバック */}
      {state.message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          state.success
            ? 'bg-green-900/30 text-green-400 border border-green-800'
            : 'bg-red-900/30 text-red-400 border border-red-800'
        }`}>
          {state.message}
        </div>
      )}

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={isPending || !selectedStoreId}
        className={`w-full rounded-xl py-5 text-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          state.success ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {isPending ? '保存中...' : state.success ? '✓ 保存しました' : '保存する'}
      </button>
    </form>
  )
}
