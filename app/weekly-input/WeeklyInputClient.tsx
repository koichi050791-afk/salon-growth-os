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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="store_id" value={selectedStoreId} />

      {/* 店舗選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          店舗 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedStoreId}
          onChange={handleStoreChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">店舗を選択</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.store_name}
            </option>
          ))}
        </select>
      </div>

      {/* 対象週 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          対象週（週の月曜日） <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="week_date"
          defaultValue={getCurrentWeekMonday()}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-400">選択した日付の週（月曜日始まり）として保存します</p>
      </div>

      {/* 売上 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          売上（円） <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="sales"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          min="0"
          step="1"
          placeholder="例: 350000"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 客数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          客数（人） <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="visits"
          value={visits}
          onChange={(e) => setVisits(e.target.value)}
          min="0"
          step="1"
          placeholder="例: 35"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 客単価（自動算出） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          客単価（自動算出）
        </label>
        <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-600">
          {unitPrice !== null ? `${unitPrice.toLocaleString('ja-JP')} 円` : '—'}
        </div>
        <p className="mt-1 text-xs text-gray-400">売上 ÷ 客数で自動計算されます</p>
      </div>

      {/* 次回予約率 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          次回予約率（%）
        </label>
        <input
          type="number"
          name="repeat_rate"
          min="0"
          max="100"
          step="0.1"
          placeholder="例: 65.5"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 口コミ数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          口コミ数（件）
        </label>
        <input
          type="number"
          name="review_count"
          min="0"
          step="1"
          placeholder="例: 3"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* フィードバック */}
      {state.message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            state.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {state.message}
        </div>
      )}

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={isPending || !selectedStoreId}
        className="w-full bg-blue-600 text-white rounded-md px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? '保存中...' : '保存する'}
      </button>
    </form>
  )
}
