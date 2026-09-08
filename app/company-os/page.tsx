import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import PersonalNavigation from '@/lib/components/PersonalNavigation'
import { getServerUser } from '@/lib/auth/server-user'
import CompanyDashboardClient from './CompanyDashboardClient'

export default async function CompanyOSPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <AuthGuard>
      <main className="min-h-dvh bg-[var(--paper)] pb-[calc(96px+env(safe-area-inset-bottom))] text-[var(--ink)]">
        <div className="mx-auto w-full max-w-[1580px] space-y-4 px-3 py-4 sm:px-6 sm:py-7">
          <header className="rounded-2xl border border-[var(--line)] bg-[var(--paper-soft)] p-4 shadow-[0_10px_30px_rgba(36,35,31,.035)] sm:p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Ikeda Company OS</p>
                <h1 className="mt-2 text-2xl font-medium sm:text-3xl">池田航一 × AI｜Company OS v2.1</h1>
                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">Decision-first cockpit｜現在収益 × 顧客創出 × 経験資産 × AI稼働 × 時間 × 2028</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] text-[var(--muted)]">
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5">2026-09-08</span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5">STATIC SNAPSHOT</span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5">未確認値は埋めない</span>
              </div>
            </div>
          </header>

          <CompanyDashboardClient />

          <p className="pb-3 text-[9px] leading-5 text-[var(--muted)]">
            Company OS v2.1｜Google Sheets / Metricool の取得済みスナップショットを反映。GA4 / GSC / note analytics / GBP / BeautyMerit / LINE は未接続。グラフは実記録のみを描画し、未確認値は補間しません。
          </p>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
