'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { fetchActionsData, completeAction, skipAction } from './actions'
import type { Store, ImprovementAction } from '@/lib/types/db'
import { issueLabel } from '@/lib/services/improvement-engine'
import type { IssueType } from '@/lib/services/improvement-engine'

function fmtWeek(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}週`
}

const STATUS_LABEL: Record<string, string> = {
  planned: '実行中',
  in_progress: '実行中',
  completed: '完了',
  skipped: 'スキップ',
}

const STATUS_CLASS: Record<string, string> = {
  planned: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  in_progress: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  completed: 'bg-emerald-500/10 text-emerald-400',
  skipped: 'bg-white/5 text-[#8B94A7]',
}

const RESULT_LABEL: Record<string, string> = {
  improved: '✅ 改善した',
  unchanged: '➡️ 変化なし',
  worsened: '⬇️ 悪化した',
}

export default function ActionsClient({
  stores,
  initialStoreId,
}: {
  stores: Store[]
  initialStoreId: string
}) {
  const [storeId, setStoreId] = useState(initialStoreId)
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchActionsData>> | null>(null)
  const [fetching, setFetching] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [resultStatus, setResultStatus] = useState<'improved' | 'unchanged' | 'worsened'>('improved')
  const [resultNote, setResultNote] = useState('')
  const [nextDecision, setNextDecision] = useState<'continue' | 'switch'>('continue')

  const load = useCallback(async (sid: string) => {
    if (!sid) return
    setFetching(true)
    setData(await fetchActionsData(sid))
    setFetching(false)
  }, [])

  useEffect(() => { load(storeId) }, [storeId, load])

  const latest = data?.latest ?? null
  const isActive = latest?.status === 'planned' || latest?.status === 'in_progress'

  async function handleComplete() {
    if (!latest) return
    setCompleting(true)
    await completeAction(latest.id, resultStatus, resultNote, nextDecision)
    setShowComplete(false)
    await load(storeId)
    setCompleting(false)
  }

  async function handleSkip() {
    if (!latest) return
    setCompleting(true)
    await skipAction(latest.id)
    await load(storeId)
    setCompleting(false)
  }

  return (
    <div className="space-y-4">
      {/* 店舗選択 */}
      {stores.length > 1 && (
        <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
          <label className="block text-sm text-[#8B94A7] mb-1">店舗</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50"
          >
            {stores.map((s) => <option key={s.id} value={s.id}>{s.store_name}</option>)}
          </select>
        </div>
      )}

      {fetching && (
        <div className="text-center text-[#8B94A7] py-10 text-sm">読み込み中...</div>
      )}

      {!fetching && storeId && (
        <>
          {/* 今週のアクション */}
          {isActive && latest ? (
            <div className="bg-[#111A2B] rounded-2xl p-4 border-l-4 border-[#D4AF37]">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[#D4AF37] text-xs font-bold">🎯 今週やること</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CLASS[latest.status]}`}>
                  {STATUS_LABEL[latest.status]}
                </span>
              </div>
              <p className="text-[#E6ECF5] text-xl font-bold mb-1">{latest.action_title}</p>
              {latest.action_detail && (
                <p className="text-[#8B94A7] text-sm mb-4">{latest.action_detail}</p>
              )}
              <p className="text-[#8B94A7] text-xs mb-4">
                課題：{issueLabel(latest.issue_type as IssueType)}
              </p>

              {!showComplete ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowComplete(true)}
                    className="flex-1 py-3 bg-[#D4AF37] text-black font-bold rounded-xl text-sm hover:opacity-90 transition"
                  >
                    ✅ 完了報告
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={completing}
                    className="px-4 py-3 bg-white/5 text-[#8B94A7] rounded-xl text-sm hover:opacity-90 transition"
                  >
                    スキップ
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#E6ECF5] text-sm font-bold">結果を記録する</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['improved', 'unchanged', 'worsened'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setResultStatus(v)}
                        className={`py-2 rounded-xl text-xs font-bold transition ${resultStatus === v ? 'bg-[#D4AF37] text-black' : 'bg-[#0B1220] text-[#8B94A7] border border-white/10'}`}
                      >
                        {RESULT_LABEL[v]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={resultNote}
                    onChange={(e) => setResultNote(e.target.value)}
                    placeholder="メモ（任意）"
                    rows={2}
                    className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                  />
                  <div>
                    <p className="text-[#8B94A7] text-xs mb-2">来週のアクション</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['continue', 'switch'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setNextDecision(v)}
                          className={`py-2 rounded-xl text-xs font-bold transition ${nextDecision === v ? 'bg-[#D4AF37] text-black' : 'bg-[#0B1220] text-[#8B94A7] border border-white/10'}`}
                        >
                          {v === 'continue' ? '🔁 継続する' : '🔄 変更する'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="flex-1 py-3 bg-[#D4AF37] text-black font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
                    >
                      {completing ? '保存中...' : '保存する'}
                    </button>
                    <button
                      onClick={() => setShowComplete(false)}
                      className="px-4 py-3 bg-white/5 text-[#8B94A7] rounded-xl text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-sm mb-4">
                {latest ? '今週のアクションは完了しています。' : '今週のアクションがまだ設定されていません。'}
              </p>
              <Link
                href={`/actions/confirm?storeId=${storeId}`}
                className="inline-block text-sm px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:opacity-90 transition"
              >
                🎯 今週のアクションを決める
              </Link>
            </div>
          )}

          {/* 履歴 */}
          {(data?.history ?? []).length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-base font-semibold mb-3">📋 過去の記録</h2>
              <div className="space-y-3">
                {(data?.history ?? []).map((a) => (
                  <div key={a.id} className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[#8B94A7] text-xs">{fmtWeek(a.week_start)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CLASS[a.status]}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <p className="text-[#E6ECF5] text-sm font-bold">{a.action_title}</p>
                    {a.result_status && (
                      <p className="text-xs text-[#8B94A7] mt-1">{RESULT_LABEL[a.result_status]}</p>
                    )}
                    {a.result_note && (
                      <p className="text-xs text-[#8B94A7] mt-0.5">{a.result_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
