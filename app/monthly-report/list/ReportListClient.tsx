'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { fetchReportList } from '../actions'
import type { ReportListItem } from '../actions'

function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function fmtYen(val: number | null): string {
  if (val === null) return '未入力'
  return '¥' + val.toLocaleString('ja-JP')
}

function fmtYearMonth(yearMonthDate: string): string {
  const [y, m] = yearMonthDate.split('-')
  return `${y}年${parseInt(m, 10)}月`
}

type Props = {
  initialYearMonth: string
  initialReports: ReportListItem[]
}

export default function ReportListClient({ initialYearMonth, initialReports }: Props) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth)
  const [reports, setReports] = useState(initialReports)
  const [loading, setLoading] = useState(false)

  const handleMonthChange = useCallback(async (newYearMonth: string) => {
    setYearMonth(newYearMonth)
    setLoading(true)
    const { reports: newReports } = await fetchReportList(newYearMonth)
    setReports(newReports)
    setLoading(false)
  }, [])

  const submitted = reports.filter((r) => r.submitted_at)
  const unsubmitted = reports.filter((r) => !r.submitted_at)

  return (
    <div className="space-y-4">
      {/* 月選択 */}
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
        <label className="block text-sm text-[#8B94A7] mb-1">対象月</label>
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-[#D4AF37]/50"
        />
      </div>

      {loading && (
        <div className="text-center text-[#8B94A7] py-8 text-sm">読み込み中...</div>
      )}

      {!loading && reports.length === 0 && (
        <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
          <p className="text-[#8B94A7] text-sm">
            この月の報告書レコードがありません。
          </p>
          <p className="text-[#8B94A7] text-xs mt-2">
            毎月1日に自動生成されます（または店舗から月次報告書を開いてください）
          </p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <>
          {/* サマリーバッジ */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#111A2B] rounded-2xl p-3 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-xs mb-1">提出済み</p>
              <p className="text-emerald-400 text-2xl font-bold">{submitted.length}</p>
            </div>
            <div className="flex-1 bg-[#111A2B] rounded-2xl p-3 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-xs mb-1">未提出</p>
              <p
                className={`text-2xl font-bold ${
                  unsubmitted.length > 0 ? 'text-red-400' : 'text-[#8B94A7]'
                }`}
              >
                {unsubmitted.length}
              </p>
            </div>
            <div className="flex-1 bg-[#111A2B] rounded-2xl p-3 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-xs mb-1">合計</p>
              <p className="text-[#E6ECF5] text-2xl font-bold">{reports.length}</p>
            </div>
          </div>

          {/* 未提出 */}
          {unsubmitted.length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-base font-semibold mb-2">⚠️ 未提出</h2>
              <div className="space-y-2">
                {unsubmitted.map((r) => (
                  <ReportCard key={r.id} report={r} yearMonth={yearMonth} />
                ))}
              </div>
            </div>
          )}

          {/* 提出済み */}
          {submitted.length > 0 && (
            <div>
              <h2 className="text-[#E6ECF5] text-base font-semibold mb-2">✅ 提出済み</h2>
              <div className="space-y-2">
                {submitted.map((r) => (
                  <ReportCard key={r.id} report={r} yearMonth={yearMonth} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReportCard({ report, yearMonth }: { report: ReportListItem; yearMonth: string }) {
  const isSubmitted = !!report.submitted_at
  return (
    <Link
      href={`/monthly-report?storeId=${report.store_id}&yearMonth=${yearMonth}`}
      className={`block bg-[#111A2B] rounded-2xl p-4 border transition hover:opacity-80 ${
        isSubmitted ? 'border-emerald-500/20' : 'border-red-500/20'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[#E6ECF5] font-bold">{report.store_name}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            isSubmitted
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isSubmitted ? '✅ 提出済み' : '⏳ 未提出'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[#8B94A7] text-sm">総売上</p>
        <p className="text-[#D4AF37] font-bold text-sm">{fmtYen(report.total_sales)}</p>
      </div>
      {isSubmitted && (
        <p className="text-[#8B94A7] text-xs mt-1">
          提出: {new Date(report.submitted_at!).toLocaleDateString('ja-JP')}
        </p>
      )}
    </Link>
  )
}
