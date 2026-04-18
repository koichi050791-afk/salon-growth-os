'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchConfirmData, saveConfirmedAction } from './actions'
import { issueLabel } from '@/lib/services/improvement-engine'
import type { IssueType } from '@/lib/services/improvement-engine'

export default function ConfirmClient({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchConfirmData>> | null>(null)
  const [fetching, setFetching] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setFetching(true)
    setData(await fetchConfirmData(storeId))
    setFetching(false)
  }, [storeId])

  useEffect(() => { load() }, [load])

  const diagnose = data?.diagnose ?? null
  const candidates = diagnose?.candidates ?? []

  async function handleSave() {
    if (!data || !diagnose || candidates.length === 0) return
    const chosen = candidates[selectedIdx]
    setSaving(true)
    const result = await saveConfirmedAction(
      storeId,
      data.weekStart,
      diagnose.issue_type,
      diagnose.issue_cause,
      chosen.action_title,
      chosen.action_detail,
    )
    setSaving(false)
    if (!result.error) {
      setSaved(true)
      setTimeout(() => router.push('/actions'), 1200)
    }
  }

  if (fetching) {
    return <div className="text-center text-[#8B94A7] py-10 text-sm">分析中...</div>
  }

  if (!diagnose || candidates.length === 0) {
    return (
      <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
        <p className="text-[#8B94A7] text-sm">
          {diagnose?.issue_type === 'no_data'
            ? '今週のデータを先に入力してください。'
            : 'アクション候補を生成できませんでした。'}
        </p>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
        <p className="text-emerald-400 text-lg font-bold mb-1">✅ 保存しました</p>
        <p className="text-[#8B94A7] text-sm">改善アクション画面に移動します...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 課題 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border-l-4 border-red-500">
        <p className="text-red-400 text-xs font-bold mb-1">⚠️ 今週の課題</p>
        <p className="text-[#E6ECF5] text-lg font-bold">{issueLabel(diagnose.issue_type as IssueType)}</p>
        <p className="text-[#8B94A7] text-sm mt-1">{diagnose.issue_cause}</p>
      </div>

      {/* アクション候補 */}
      <div>
        <p className="text-[#8B94A7] text-xs mb-3">アクションを1つ選んでください</p>
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`w-full text-left p-4 rounded-2xl border transition ${selectedIdx === i ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/5 bg-[#111A2B]'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedIdx === i ? 'border-[#D4AF37]' : 'border-white/20'}`}>
                  {selectedIdx === i && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                </div>
                <div>
                  <p className={`text-sm font-bold mb-1 ${selectedIdx === i ? 'text-[#D4AF37]' : 'text-[#E6ECF5]'}`}>{c.action_title}</p>
                  <p className="text-[#8B94A7] text-xs">{c.action_detail}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? '保存中...' : '🎯 このアクションで決定する'}
      </button>
    </div>
  )
}
