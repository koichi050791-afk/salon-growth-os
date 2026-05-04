import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getServerProfile } from '@/lib/repositories/profiles'
import { fetchReportList } from '../actions'
import ReportListClient from './ReportListClient'

function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default async function ReportListPage({
  searchParams,
}: {
  searchParams: Promise<{ yearMonth?: string }>
}) {
  const profile = await getServerProfile()
  const params = await searchParams
  const yearMonth = params.yearMonth ?? getCurrentYearMonth()

  // 店長は自店舗ページへ（クライアント側リダイレクト）
  const isManager = profile?.role === 'manager'

  const { reports } = await fetchReportList(yearMonth)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-24">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#E6ECF5]">📋 月次報告書 一覧</h1>
            <a
              href="/monthly-report"
              className="text-xs text-[#8B94A7] border border-white/10 rounded-full px-3 py-1.5 hover:opacity-80 transition"
            >
              ← 自店舗
            </a>
          </div>
          {isManager ? (
            <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-sm">この画面はオーナーのみ閲覧できます。</p>
              <a href="/monthly-report" className="text-[#D4AF37] text-sm underline mt-2 block">
                自店舗の月次報告書へ
              </a>
            </div>
          ) : (
            <ReportListClient initialYearMonth={yearMonth} initialReports={reports} />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
