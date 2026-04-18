'use client'

import { useTransition } from 'react'
import { recordActionLog } from './actions'

type Props = {
  staffId: string
  weekDate: string
  actionText: string
  currentStatus: boolean | null
}

export default function ActionLogClient({ staffId, weekDate, actionText, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick(isExecuted: boolean) {
    startTransition(async () => {
      await recordActionLog(staffId, weekDate, actionText, isExecuted)
    })
  }

  return (
    <div className="bg-[#111A2B] rounded-2xl border border-white/5 p-5">
      <h2 className="text-[#E6ECF5] font-semibold mb-2">今週のアクションを実行しましたか？</h2>
      <p className="text-[#8B94A7] text-sm mb-5">{actionText}</p>

      {currentStatus !== null && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
          currentStatus
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-white/5 text-[#8B94A7] border border-white/10'
        }`}>
          {currentStatus ? '✓ 実行済みとして記録されています' : '未実施として記録されています'}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleClick(true)}
          disabled={isPending}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition disabled:opacity-50 ${
            currentStatus === true
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500 hover:opacity-90 text-white'
          }`}
        >
          {isPending ? '...' : '✅ 実行した'}
        </button>
        <button
          onClick={() => handleClick(false)}
          disabled={isPending}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition disabled:opacity-50 ${
            currentStatus === false
              ? 'bg-[#0B1220] border border-white/20 text-[#8B94A7]'
              : 'bg-[#0B1220] border border-white/10 text-[#8B94A7] hover:border-white/20'
          }`}
        >
          {isPending ? '...' : '❌ 未実施'}
        </button>
      </div>
    </div>
  )
}
