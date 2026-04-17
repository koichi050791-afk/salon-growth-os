'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveMonthlyConfig, type SaveState } from './actions'
import type { Store, MonthlyConfig } from '@/lib/types/db'

type Props = {
  stores: Store[]
  selectedStoreId: string
  configs: MonthlyConfig[]
}

const initialState: SaveState = { message: '', success: false }

function fmt(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}

export default function MonthlyConfigClient({ stores, selectedStoreId, configs }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(saveMonthlyConfig, initialState)

  // undefined = フォーム非表示, null = 新規, MonthlyConfig = 編集
  const [editingConfig, setEditingConfig] = useState<MonthlyConfig | null | undefined>(undefined)

  const prevStateRef = useRef(initialState)
  useEffect(() => {
    if (state !== prevStateRef.current && state.success) {
      router.refresh()
      setEditingConfig(undefined)
    }
    prevStateRef.current = state
  }, [state, router])

  const defaultMonth = new Date().toISOString().slice(0, 7)

  const inputClass =
    'block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
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
            setEditingConfig(undefined)
            router.push(val ? `/monthly-config?storeId=${val}` : '/monthly-config')
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

      {selectedStoreId && (
        <>
          {/* 一覧ヘッダー */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">月次基準値一覧</h2>
            <button
              onClick={() => setEditingConfig(null)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              ＋ 新規追加
            </button>
          </div>

          {/* 一覧テーブル */}
          {configs.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center border border-gray-200 rounded-lg bg-white">
              データがありません。「新規追加」から登録してください。
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      '対象月',
                      '目標売上',
                      '目標客単価',
                      '目標来店数',
                      '目標生産性',
                      '目標再来率',
                      'メモ',
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {configs.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        editingConfig !== null &&
                        editingConfig !== undefined &&
                        editingConfig.id === c.id
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {c.target_month}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {fmt(c.target_sales, '円')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {fmt(c.target_unit_price, '円')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {fmt(c.target_visits, '件')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {fmt(c.target_productivity)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {c.target_repeat_rate !== null ? `${c.target_repeat_rate}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {c.memo ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setEditingConfig(c)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          編集
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 編集・新規フォーム */}
          {editingConfig !== undefined && (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-800">
                  {editingConfig === null
                    ? '新規追加'
                    : `${editingConfig.target_month} を編集`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingConfig(undefined)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕ 閉じる
                </button>
              </div>

              <form
                key={editingConfig === null ? 'new' : editingConfig.id}
                action={formAction}
                className="space-y-4"
              >
                <input type="hidden" name="store_id" value={selectedStoreId} />

                <div>
                  <label className={labelClass}>対象月</label>
                  <input
                    type="month"
                    name="target_month"
                    defaultValue={editingConfig?.target_month ?? defaultMonth}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>目標売上（円）</label>
                    <input
                      type="number"
                      name="target_sales"
                      defaultValue={editingConfig?.target_sales ?? ''}
                      min="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>目標客単価（円）</label>
                    <input
                      type="number"
                      name="target_unit_price"
                      defaultValue={editingConfig?.target_unit_price ?? ''}
                      min="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>目標来店数</label>
                    <input
                      type="number"
                      name="target_visits"
                      defaultValue={editingConfig?.target_visits ?? ''}
                      min="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>目標生産性（人時売上）</label>
                    <input
                      type="number"
                      name="target_productivity"
                      defaultValue={editingConfig?.target_productivity ?? ''}
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
                      defaultValue={editingConfig?.target_repeat_rate ?? ''}
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
                      defaultValue={editingConfig?.memo ?? ''}
                      rows={2}
                      className={inputClass}
                    />
                  </div>
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

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {pending ? '保存中...' : '保存する'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingConfig(undefined)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}
