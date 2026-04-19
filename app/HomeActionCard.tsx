'use client'

import { useState } from 'react'
import Link from 'next/link'
import { completeAction, skipAction } from '@/app/actions/actions'
import type { ImprovementAction } from '@/lib/types/db'

export default function HomeActionCard({
  action,
  storeId,
}: {
  action: ImprovementAction | null
  storeId: string
}) {
  const [status, setStatus] = useState(action?.status ?? null)
  const [loading, setLoading] = useState(false)

  if (!action) {
    return (
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-4">
        <p className="text-[#D4AF37] font-bold mb-3">🎯 来週の一手がまだ決まっていません</p>
        <Link
          href={`/actions/confirm?storeId=${storeId}`}
          className="inline-block text-sm px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:opacity-90 transition"
        >
          改善を決める →
        </Link>
      </div>
    )
  }

  const isActive = status === 'planned' || status === 'in_progress'

  async function handleComplete() {
    setLoading(true)
    setStatus('completed')
    await completeAction(action!.id, 'improved', '', 'continue')
    setLoading(false)
  }

  async function handleSkip() {
    setLoading(true)
    setStatus('skipped')
    await skipAction(action!.id)
    setLoading(false)
  }

  return (
    <div className="bg-[#111A2B] rounded-2xl p-4 border-l-4 border-[#D4AF37]">
      <p className="text-[#D4AF37] text-xs font-bold mb-1">🎯 今週やること</p>
      <p className="text-[#E6ECF5] text-xl font-bold mb-1">{action.action_title}</p>
      {action.action_detail && (
        <p className="text-[#8B94A7] text-sm mb-3">{action.action_detail}</p>
      )}

      {isActive ? (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            ✅ 完了した
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 py-3 bg-[#1E293B] text-[#8B94A7] rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            ❌ できなかった
          </button>
        </div>
      ) : status === 'completed' ? (
        <p className="text-emerald-400 text-sm font-bold mt-2">✅ 実行済み</p>
      ) : (
        <p className="text-red-400 text-sm mt-2">❌ 未実施</p>
      )}
    </div>
  )
}
