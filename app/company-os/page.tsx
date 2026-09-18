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
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Ikeda × AI Business OS</p>
                <h1 className="mt-2 text-2xl font-medium sm:text-3xl">池田航一 × AI｜Company OS v3.0</h1>
                <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--muted)]">足元の観察・記録・小さな実験と、2028年以降へつながる長期構想を同じ画面で見る。</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] text-[var(--muted)]">
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5">2026-09-11</span>
                <span className="rounded-full border border-[var(--green)] bg-[rgba(104,123,99,.08)] px-3 py-1.5 text-[var(--green)]">FIELD VALIDATION</span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5">未確認値は埋めない</span>
              </div>
            </div>
          </header>

          <CompanyDashboardClient />

          <p className="pb-3 text-[9px] leading-5 text-[var(--muted)]">
            Company OS v3.0｜長期Phaseは未来の設計地図。現在の実運用はIssue #61のPhase1境界を維持し、KPI・判断価値のあるCase・匿名の最小観測に限定する。
          </p>
        </div>
        <PersonalNavigation />
      </main>
    </AuthGuard>
  )
}
