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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">今週のアクションを実行しましたか？</h2>

      {currentStatus !== null && (
        <div
          className={`mb-4 rounded-md px-4 py-2.5 text-sm font-medium ${
            currentStatus
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          {currentStatus ? '✓ 実行済みとして記録済み' : '未実施として記録済み'}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleClick(true)}
          disabled={isPending}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 ${
            currentStatus === true
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
          }`}
        >
          {isPending ? '...' : '実行した'}
        </button>
        <button
          onClick={() => handleClick(false)}
          disabled={isPending}
          className={`flex-1 py-2.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 ${
            currentStatus === false
              ? 'bg-gray-500 text-white border-gray-500'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isPending ? '...' : '未実施'}
        </button>
      </div>
    </div>
  )
}
