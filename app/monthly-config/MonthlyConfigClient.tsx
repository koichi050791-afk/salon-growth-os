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

const INPUT_CLASS =
  'block w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 placeholder:text-slate-600'
const LABEL_CLASS = 'block text-sm text-slate-400 mb-1.5'

export default function MonthlyConfigClient({ stores, selectedStoreId, configs }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(saveMonthlyConfig, initialState)

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

  return (
    <div className="space-y-4">
      {/* 店舗選択 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <label className={LABEL_CLASS}>店舗</label>
        <select
          value={selectedStoreId}
          onChange={(e) => {
            const val = e.target.value
            setEditingConfig(undefined)
            router.push(val ? `/monthly-config?storeId=${val}` : '/monthly-config')
          }}
          className={INPUT_CLASS}
        >
          <option value="">-- 店舗を選択してください --</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>{store.store_name}</option>
          ))}
        </select>
      </div>

      {selectedStoreId && (
        <>
          {/* 一覧ヘッダー */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">月次基準値一覧</h2>
            <button
              onClick={() => setEditingConfig(null)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition active:scale-[0.98]"
            >
              ＋ 新規追加
            </button>
          </div>

          {/* 一覧 */}
          {configs.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl py-10 text-center text-slate-500 text-sm">
              データがありません。「新規追加」から登録してください。
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((c) => (
                <div
                  key={c.id}
                  className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border ${
                    editingConfig && editingConfig.id === c.id
                      ? 'border-blue-700/50'
                      : 'border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold">{c.target_month}</p>
                    <button
                      onClick={() => setEditingConfig(c)}
                      className="text-blue-400 text-sm hover:text-blue-300 transition"
                    >
                      編集
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Row label="目標売上"   value={fmt(c.target_sales, '円')} />
                    <Row label="目標客単価" value={fmt(c.target_unit_price, '円')} />
                    <Row label="目標来店数" value={fmt(c.target_visits, '件')} />
                    <Row label="目標生産性" value={fmt(c.target_productivity)} />
                    <Row label="目標再来率" value={c.target_repeat_rate !== null ? `${c.target_repeat_rate}%` : '—'} />
                    {c.memo && <Row label="メモ" value={c.memo} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 編集・新規フォーム */}
          {editingConfig !== undefined && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold">
                  {editingConfig === null ? '新規追加' : `${editingConfig.target_month} を編集`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingConfig(undefined)}
                  className="text-slate-400 hover:text-slate-200 text-sm transition"
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
                  <label className={LABEL_CLASS}>対象月</label>
                  <input
                    type="month"
                    name="target_month"
                    defaultValue={editingConfig?.target_month ?? defaultMonth}
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>目標売上（円）</label>
                    <input type="number" name="target_sales"
                      defaultValue={editingConfig?.target_sales ?? ''}
                      min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標客単価（円）</label>
                    <input type="number" name="target_unit_price"
                      defaultValue={editingConfig?.target_unit_price ?? ''}
                      min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標来店数</label>
                    <input type="number" name="target_visits"
                      defaultValue={editingConfig?.target_visits ?? ''}
                      min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標生産性</label>
                    <input type="number" name="target_productivity"
                      defaultValue={editingConfig?.target_productivity ?? ''}
                      min="0" step="0.01" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標再来率（%）</label>
                    <input type="number" name="target_repeat_rate"
                      defaultValue={editingConfig?.target_repeat_rate ?? ''}
                      min="0" max="100" step="0.1" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>メモ</label>
                    <textarea name="memo"
                      defaultValue={editingConfig?.memo ?? ''}
                      rows={2} className={INPUT_CLASS} />
                  </div>
                </div>

                {state.message && (
                  <div className={`rounded-xl px-4 py-3 text-sm border ${
                    state.success
                      ? 'bg-green-900/30 text-green-400 border-green-700/50'
                      : 'bg-red-900/30 text-red-400 border-red-700/50'
                  }`}>
                    {state.message}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition active:scale-[0.98]"
                  >
                    {pending ? '保存中...' : '保存する'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingConfig(undefined)}
                    className="px-4 py-3 border border-slate-700 rounded-xl text-sm text-slate-400 hover:border-slate-500 transition"
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-300 text-sm font-medium">{value}</span>
    </div>
  )
}
