'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchStaffListData } from './actions'
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

function fmt(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}

const INPUT_CLASS =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-500'
const LABEL_CLASS = 'block text-sm text-gray-400 mb-1.5'

// ──────────────────────────────────────────────
// 型
// ──────────────────────────────────────────────
type StaffCard = {
  id: string
  name: string
  sales: number | null
  visits: number | null
  unitPrice: number | null
  prevSales: number | null
  salesDiff: number | null
  isAlert: boolean
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
export default function StaffListClient({ stores }: { stores: Store[] }) {
  const router = useRouter()
  const [storeId, setStoreId] = useState('')
  const [weekStart, setWeekStart] = useState(getSundayISO())
  const [cards, setCards] = useState<StaffCard[]>([])
  const [fetching, setFetching] = useState(false)

  const loadData = useCallback(async (sid: string, week: string) => {
    if (!sid) return
    setFetching(true)

    const result = await fetchStaffListData(sid, week)

    const built: StaffCard[] = result.staffList.map((s) => {
      const thisInput = result.thisWeekInputs.find((i) => i.staff_id === s.id) ?? null
      const lastInput = result.lastWeekInputs.find((i) => i.staff_id === s.id) ?? null

      const sales = thisInput?.sales ?? null
      const visits = thisInput?.visits ?? null
      const unitPrice =
        sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
      const prevSales = lastInput?.sales ?? null

      const salesDiff =
        sales !== null && prevSales !== null && prevSales > 0
          ? ((sales - prevSales) / prevSales) * 100
          : null

      const isAlert = salesDiff !== null && salesDiff <= -20

      return { id: s.id, name: s.name, sales, visits, unitPrice, prevSales, salesDiff, isAlert }
    })

    setCards(built)
    setFetching(false)
  }, [])

  useEffect(() => {
    loadData(storeId, weekStart)
  }, [storeId, weekStart, loadData])

  function handleStoreChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStoreId(val)
    router.replace(val ? `/staff?storeId=${val}` : '/staff')
  }

  return (
    <div>
      {/* 店舗・週選択 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-4 space-y-3">
        <div>
          <label className={LABEL_CLASS}>店舗</label>
          <select value={storeId} onChange={handleStoreChange} className={INPUT_CLASS}>
            <option value="">-- 店舗を選択 --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.store_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>対象週（日曜日）</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {fetching && (
        <div className="text-center text-gray-500 py-10 text-sm">データを読み込み中...</div>
      )}

      {!fetching && storeId && (
        <>
          {cards.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 py-10 text-center text-gray-500 text-sm">
              スタッフが登録されていません
            </div>
          ) : (
            cards.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl p-5 mb-3 ${
                  c.isAlert
                    ? 'bg-red-900/20 border border-red-800'
                    : 'bg-gray-900 border border-gray-800'
                }`}
              >
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-lg font-bold">{c.name}</p>
                  {c.isAlert && (
                    <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
                      ⚠️ 先週より大きく下落
                    </span>
                  )}
                </div>

                {c.sales === null && c.visits === null ? (
                  <p className="text-gray-500 text-sm">今週のデータ未入力</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">週売上</p>
                      <p className="text-white font-medium">{fmt(c.sales, '円')}</p>
                      {c.salesDiff !== null ? (
                        <p className={`text-xs mt-0.5 ${c.salesDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {c.salesDiff >= 0 ? '↑' : '↓'} {c.salesDiff >= 0 ? '+' : ''}{c.salesDiff.toFixed(1)}%
                        </p>
                      ) : c.prevSales === null ? (
                        <p className="text-gray-500 text-xs mt-0.5">初回</p>
                      ) : (
                        <p className="text-gray-500 text-xs mt-0.5">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">週客数</p>
                      <p className="text-white font-medium">{fmt(c.visits, '人')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">客単価</p>
                      <p className="text-white font-medium">{fmt(c.unitPrice, '円')}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {!storeId && !fetching && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 py-12 text-center text-gray-500 text-sm">
          店舗を選択してください
        </div>
      )}
    </div>
  )
}
