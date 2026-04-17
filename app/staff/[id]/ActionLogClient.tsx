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
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-white font-semibold mb-2">今週のアクションを実行しましたか？</h2>
      <p className="text-gray-400 text-sm mb-5">{actionText}</p>

      {currentStatus !== null && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
          currentStatus
            ? 'bg-green-900/30 text-green-400 border border-green-800'
            : 'bg-gray-800 text-gray-400 border border-gray-700'
        }`}>
          {currentStatus ? '✓ 実行済みとして記録されています' : '未実施として記録されています'}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleClick(true)}
          disabled={isPending}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-colors disabled:opacity-50 ${
            currentStatus === true
              ? 'bg-green-600 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {isPending ? '...' : '✅ 実行した'}
        </button>
        <button
          onClick={() => handleClick(false)}
          disabled={isPending}
          className={`flex-1 py-4 rounded-xl text-base font-bold transition-colors disabled:opacity-50 ${
            currentStatus === false
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {isPending ? '...' : '❌ 未実施'}
        </button>
      </div>
    </div>
  )
}
