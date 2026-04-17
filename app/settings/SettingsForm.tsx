'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { saveMonthlyConfig, type SaveState } from './actions'
import type { Store, MonthlyConfig } from '@/lib/types/db'

type Props = {
  stores: Store[]
  selectedStoreId: string
  config: MonthlyConfig | null
}

const initialState: SaveState = { message: '', success: false }

export default function SettingsForm({ stores, selectedStoreId, config }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(saveMonthlyConfig, initialState)

  const defaultMonth = new Date().toISOString().slice(0, 7)

  const inputClass =
    'block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="space-y-6">
      {/* 店舗選択 */}
      <div>
        <label className={labelClass}>店舗</label>
        <select
          value={selectedStoreId}
          onChange={(e) => {
            const val = e.target.value
            router.push(val ? `/settings?storeId=${val}` : '/settings')
          }}
          className={inputClass}
        >
          <option value="">-- 店舗を選択してください --</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.store_name}
            </option>
          ))}
        </select>
      </div>

      {/* 月次基準値フォーム（店舗選択後に表示） */}
      {selectedStoreId && (
        <form key={selectedStoreId} action={formAction} className="space-y-4">
          <input type="hidden" name="store_id" value={selectedStoreId} />

          <div>
            <label className={labelClass}>対象月</label>
            <input
              type="month"
              name="target_month"
              defaultValue={config?.target_month ?? defaultMonth}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目標売上（円）</label>
            <input
              type="number"
              name="target_sales"
              defaultValue={config?.target_sales ?? ''}
              min="0"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目標客単価（円）</label>
            <input
              type="number"
              name="target_unit_price"
              defaultValue={config?.target_unit_price ?? ''}
              min="0"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目標来店数</label>
            <input
              type="number"
              name="target_visits"
              defaultValue={config?.target_visits ?? ''}
              min="0"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目標生産性（人時売上）</label>
            <input
              type="number"
              name="target_productivity"
              defaultValue={config?.target_productivity ?? ''}
              min="0"
              step="0.01"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>目標再来率（%）</label>
            <input
              type="number"
              name="target_repeat_rate"
              defaultValue={config?.target_repeat_rate ?? ''}
              min="0"
              max="100"
              step="0.1"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>メモ</label>
            <textarea
              name="memo"
              defaultValue={config?.memo ?? ''}
              rows={3}
              className={inputClass}
            />
          </div>

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

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? '保存中...' : '保存する'}
          </button>
        </form>
      )}
    </div>
  )
}
