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

const INPUT_CLASS = 'block w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-4 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#8B94A7]/50'
const LABEL_CLASS = 'block text-sm text-[#8B94A7] mb-1'

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
  const latestConfig = configs[0] ?? null

  return (
    <div className="space-y-4">
      {/* 店舗選択 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
        <label className={LABEL_CLASS}>店舗</label>
        <select
          value={selectedStoreId}
          onChange={(e) => {
            const val = e.target.value
            setEditingConfig(undefined)
            router.push(val ? `/monthly-config?storeId=${val}` : '/monthly-config')
          }}
          className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50"
        >
          <option value="">-- 店舗を選択してください --</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.store_name}</option>)}
        </select>
      </div>

      {selectedStoreId && (
        <>
          {/* 週次必要数値（最新設定から自動算出） */}
          {latestConfig && (() => {
            const weeklySales = latestConfig.target_sales != null ? Math.round(latestConfig.target_sales / 4.3) : null
            const dailySales = latestConfig.target_sales != null ? Math.round(latestConfig.target_sales / 25) : null
            const weeklyVisits = latestConfig.target_visits != null ? Math.round(latestConfig.target_visits / 4.3) : null
            const unitPrice = latestConfig.target_unit_price ?? null
            return (
              <div className="bg-[#111A2B] rounded-2xl p-4 border border-[#D4AF37]/20">
                <p className="text-[#D4AF37] font-bold mb-1">📊 週次必要数値（自動算出）</p>
                <p className="text-[#8B94A7] text-xs mb-4">{latestConfig.target_month} の目標から算出</p>
                <div className="space-y-3">
                  {latestConfig.target_sales != null && (
                    <div>
                      <p className="text-[#8B94A7] text-xs mb-2">月目標 {fmt(latestConfig.target_sales, '円')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0B1220] rounded-xl p-3">
                          <p className="text-[#8B94A7] text-xs mb-1">週売上</p>
                          <p className="text-[#E6ECF5] text-xl font-bold">{weeklySales !== null ? '¥' + weeklySales.toLocaleString('ja-JP') : '—'}</p>
                          <p className="text-[#8B94A7] text-xs">必要</p>
                        </div>
                        <div className="bg-[#0B1220] rounded-xl p-3">
                          <p className="text-[#8B94A7] text-xs mb-1">日売上</p>
                          <p className="text-[#E6ECF5] text-xl font-bold">{dailySales !== null ? '¥' + dailySales.toLocaleString('ja-JP') : '—'}</p>
                          <p className="text-[#8B94A7] text-xs">必要</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {weeklyVisits !== null && (
                      <div className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[#8B94A7] text-xs mb-1">週客数</p>
                        <p className="text-[#E6ECF5] text-xl font-bold">{weeklyVisits}人</p>
                        <p className="text-[#8B94A7] text-xs">必要</p>
                      </div>
                    )}
                    {unitPrice !== null && (
                      <div className="bg-[#0B1220] rounded-xl p-3">
                        <p className="text-[#8B94A7] text-xs mb-1">必要客単価</p>
                        <p className="text-[#E6ECF5] text-xl font-bold">{'¥' + unitPrice.toLocaleString('ja-JP')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 一覧ヘッダー */}
          <div className="flex items-center justify-between">
            <h2 className="text-[#E6ECF5] font-semibold">月次基準値一覧</h2>
            <button
              onClick={() => setEditingConfig(null)}
              className="bg-[#D4AF37] text-black text-sm px-4 py-2 rounded-xl font-bold hover:opacity-90 transition active:scale-[0.98]"
            >
              ＋ 新規追加
            </button>
          </div>

          {/* 一覧 */}
          {configs.length === 0 ? (
            <div className="bg-[#111A2B] rounded-2xl py-10 border border-white/5 text-center text-[#8B94A7] text-sm">
              データがありません。「新規追加」から登録してください。
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((c) => (
                <div
                  key={c.id}
                  className={`bg-[#111A2B] rounded-2xl p-4 border ${editingConfig && editingConfig.id === c.id ? 'border-[#D4AF37]/30' : 'border-white/5'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#E6ECF5] font-bold">{c.target_month}</p>
                    <button onClick={() => setEditingConfig(c)} className="text-[#D4AF37] text-sm hover:opacity-70 transition">編集</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Row label="目標売上"   value={fmt(c.target_sales, '円')} />
                    <Row label="目標客単価" value={fmt(c.target_unit_price, '円')} />
                    <Row label="目標来店数" value={fmt(c.target_visits, '件')} />
                    <Row label="目標生産性" value={fmt(c.target_productivity)} />
                    <Row label="目標再来率" value={c.target_repeat_rate !== null ? `${c.target_repeat_rate}%` : '—'} />
                    <Row label="営業日数"   value={c.working_days !== null ? `${c.working_days}日` : '—'} />
                    <Row label="稼働スタッフ" value={c.active_staff_count !== null ? `${c.active_staff_count}人` : '—'} />
                    {c.memo && <Row label="メモ" value={c.memo} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 編集・新規フォーム */}
          {editingConfig !== undefined && (
            <div className="bg-[#111A2B] rounded-2xl border border-[#D4AF37]/20 p-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[#E6ECF5] font-bold">
                  {editingConfig === null ? '新規追加' : `${editingConfig.target_month} を編集`}
                </h3>
                <button type="button" onClick={() => setEditingConfig(undefined)} className="text-[#8B94A7] hover:text-[#E6ECF5] text-sm transition">
                  ✕ 閉じる
                </button>
              </div>

              <form key={editingConfig === null ? 'new' : editingConfig.id} action={formAction} className="space-y-4">
                <input type="hidden" name="store_id" value={selectedStoreId} />

                <div>
                  <label className={LABEL_CLASS}>対象月</label>
                  <input type="month" name="target_month" defaultValue={editingConfig?.target_month ?? defaultMonth} required className={INPUT_CLASS} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>目標売上（円）</label>
                    <input type="number" name="target_sales" defaultValue={editingConfig?.target_sales ?? ''} min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標客単価（円）</label>
                    <input type="number" name="target_unit_price" defaultValue={editingConfig?.target_unit_price ?? ''} min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標来店数</label>
                    <input type="number" name="target_visits" defaultValue={editingConfig?.target_visits ?? ''} min="0" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標生産性</label>
                    <input type="number" name="target_productivity" defaultValue={editingConfig?.target_productivity ?? ''} min="0" step="0.01" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>目標再来率（%）</label>
                    <input type="number" name="target_repeat_rate" defaultValue={editingConfig?.target_repeat_rate ?? ''} min="0" max="100" step="0.1" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>メモ</label>
                    <textarea name="memo" defaultValue={editingConfig?.memo ?? ''} rows={2} className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>月の営業日数</label>
                    <p className="text-[#8B94A7] text-xs mb-1">月曜定休を除いた営業日数を入力してください</p>
                    <input type="number" name="working_days" defaultValue={editingConfig?.working_days ?? ''} min="1" max="31" placeholder="例：26" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>稼働スタッフ人数</label>
                    <p className="text-[#8B94A7] text-xs mb-1">今月実際に稼働するスタッフの人数</p>
                    <input type="number" name="active_staff_count" defaultValue={editingConfig?.active_staff_count ?? ''} min="1" placeholder="例：4" className={INPUT_CLASS} />
                  </div>
                </div>

                {state.message && (
                  <div className={`rounded-xl px-4 py-3 text-sm border ${
                    state.success
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {state.message}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={pending}
                    className="flex-1 bg-[#D4AF37] text-black py-4 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition active:scale-[0.98]">
                    {pending ? '保存中...' : '保存する'}
                  </button>
                  <button type="button" onClick={() => setEditingConfig(undefined)}
                    className="px-4 py-4 bg-[#111A2B] border border-[#D4AF37]/30 rounded-xl text-sm text-[#D4AF37] hover:opacity-70 transition">
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
      <span className="text-[#8B94A7] text-xs">{label}</span>
      <span className="text-[#E6ECF5] text-sm font-medium">{value}</span>
    </div>
  )
}
