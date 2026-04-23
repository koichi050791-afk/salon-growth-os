import Link from 'next/link'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getWeeklyStoreInput, getStoreInputsByDateRange } from '@/lib/repositories/weekly-store-inputs'
import { getServerProfile } from '@/lib/repositories/profiles'
import { getLatestImprovementAction } from '@/lib/repositories/improvement-actions'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import HomeActionCard from './HomeActionCard'
import type { WeeklyStoreInput, MonthlyConfig } from '@/lib/types/db'
import {
  calcMonthlyProductivity,
  calcElapsedWorkingDays,
  formatMonthlyProductivity,
  getMonthlyProductivityStatus,
} from '@/lib/calculations'

const WEEKLY_WEEKS = 4.3

function getSundayISO(): string {
  const today = new Date()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return sunday.toISOString().slice(0, 10)
}

function prevWeekISO(iso: string): string {
  const d = new Date(iso)
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function fmtYen(val: number | null): string {
  if (val === null) return '—'
  return '¥' + val.toLocaleString('ja-JP')
}

function diffPct(
  current: number | null,
  prev: number | null,
): { text: string; up: boolean } | null {
  if (current === null || prev === null || prev === 0) return null
  const p = ((current - prev) / prev) * 100
  return { text: `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`, up: p >= 0 }
}

function targetPct(
  current: number | null,
  target: number | null,
): { text: string; up: boolean } | null {
  if (current === null || target === null || target === 0) return null
  const p = (current / target) * 100
  return { text: `目標比 ${p.toFixed(0)}%`, up: p >= 90 }
}

export default async function Home() {
  const profile = await getServerProfile()
  const { data: stores } = await getActiveStores()

  const isManager = profile?.role === 'manager'
  const mainStore = isManager && profile?.store_id
    ? (stores.find((s) => s.id === profile.store_id) ?? stores[0])
    : stores[0]

  const today = new Date()
  const thisWeekStart = getSundayISO()
  const lastWeekStart = prevWeekISO(thisWeekStart)
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [thisWeek, lastWeek, configResult, latestAction, monthlyInputsResult] = mainStore
    ? await Promise.all([
        getWeeklyStoreInput(mainStore.id, thisWeekStart),
        getWeeklyStoreInput(mainStore.id, lastWeekStart),
        getLatestMonthlyConfig(mainStore.id),
        getLatestImprovementAction(mainStore.id),
        getStoreInputsByDateRange(mainStore.id, monthStart, thisWeekStart),
      ])
    : [null, null, { data: null }, null, { data: [], error: null }]

  const config = (configResult as { data: MonthlyConfig | null }).data ?? null
  const weeklyTargetSales = config?.target_sales != null ? Math.round(config.target_sales / WEEKLY_WEEKS) : null

  const sales = thisWeek?.sales ?? null
  const visits = thisWeek?.visits ?? null
  const unitPrice = sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = lastWeek?.sales ?? null
  const prevVisits = lastWeek?.visits ?? null
  const prevUnitPrice = prevSales !== null && (lastWeek?.visits ?? 0) > 0
    ? Math.round(prevSales / lastWeek!.visits!) : null

  const nextVisitCount = thisWeek?.next_visit_count ?? null
  const prevNextVisitCount = lastWeek?.next_visit_count ?? null
  const repeatRate = nextVisitCount !== null && visits !== null && visits > 0
    ? Math.round((nextVisitCount / visits) * 100) : null
  const prevRepeatRate = prevNextVisitCount !== null && prevVisits !== null && prevVisits > 0
    ? Math.round((prevNextVisitCount / prevVisits) * 100) : null

  const monthlyInputs = (monthlyInputsResult as { data: WeeklyStoreInput[] }).data ?? []
  const monthlySalesArr = monthlyInputs.map((i) => i.sales).filter((s): s is number => s !== null)
  const monthlySalesVal = monthlySalesArr.length > 0 ? monthlySalesArr.reduce((a, b) => a + b, 0) : null
  const elapsedDays = calcElapsedWorkingDays(today)
  const workingDays = config?.working_days ?? null
  const activeStaffCount = config?.active_staff_count ?? null
  const monthlyProd = monthlySalesVal !== null
    ? calcMonthlyProductivity(monthlySalesVal, elapsedDays, workingDays, activeStaffCount)
    : null
  const monthlyProdStatus = getMonthlyProductivityStatus(monthlyProd)
  const monthlyConfigMissing = workingDays === null || activeStaffCount === null

  const dateLabel = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const hasData = thisWeek !== null

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* ヘッダー */}
          <div>
            <h1 className="text-lg font-semibold text-[#E6ECF5]">Salon Growth OS</h1>
            <p className="text-[#8B94A7] text-xs mt-0.5">{dateLabel}</p>
          </div>

          {!mainStore ? (
            <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-sm mb-4">店舗データがありません</p>
              <Link href="/settings" className="text-sm px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:opacity-90 transition">
                設定から店舗を追加する
              </Link>
            </div>
          ) : (
            <>
              {/* 今週のアクション（インタラクティブカード） */}
              <HomeActionCard action={latestAction} storeId={mainStore.id} />

              {/* 今週速報カード */}
              <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#E6ECF5] text-base font-semibold">{mainStore.store_name}</p>
                  <span className="bg-[#D4AF37]/10 text-[#D4AF37] rounded-full px-3 py-1 text-xs font-bold">
                    今週速報
                  </span>
                </div>

                {!hasData ? (
                  <div className="text-center py-4">
                    <p className="text-[#8B94A7] text-sm mb-4">今週のデータが未入力です</p>
                    <Link
                      href={`/weekly-input?storeId=${mainStore.id}`}
                      className="inline-block text-sm px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:opacity-90 transition"
                    >
                      週次入力へ →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="週売上" value={fmtYen(sales)}
                      diff={targetPct(sales, weeklyTargetSales) ?? diffPct(sales, prevSales)} />
                    <MetricCard label="客数" value={visits !== null ? `${visits}人` : '—'}
                      diff={diffPct(visits, prevVisits)} />
                    <MetricCard label="客単価" value={fmtYen(unitPrice)}
                      diff={diffPct(unitPrice, prevUnitPrice)} />
                    <MetricCard label="次回予約率" value={repeatRate !== null ? `${repeatRate}%` : '—'}
                      diff={diffPct(repeatRate, prevRepeatRate)} />
                    <MonthlyProdCard
                      value={formatMonthlyProductivity(monthlyProd)}
                      status={monthlyProdStatus}
                      missing={monthlyConfigMissing}
                    />
                  </div>
                )}
              </div>

              {/* ショートカット */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/weekly-input?storeId=${mainStore.id}`}
                  className="text-center text-sm py-4 bg-[#D4AF37] rounded-xl text-black font-bold hover:opacity-90 transition">
                  ➕ 週次入力
                </Link>
                <Link href={`/dashboard?storeId=${mainStore.id}`}
                  className="text-center text-sm py-4 bg-[#111A2B] border border-[#D4AF37]/30 rounded-xl text-[#D4AF37] hover:opacity-90 transition">
                  📊 ダッシュボード
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function MetricCard({
  label, value, diff,
}: {
  label: string; value: string; diff: { text: string; up: boolean } | null
}) {
  return (
    <div className="bg-[#0B1220] rounded-xl p-3 border border-white/5">
      <p className="text-[#8B94A7] text-xs mb-1">{label}</p>
      <p className="text-[#E6ECF5] text-2xl font-bold">{value}</p>
      {diff ? (
        <p className={`text-xs mt-1 ${diff.up ? 'text-emerald-400' : 'text-red-400'}`}>
          {diff.up ? '↑' : '↓'} {diff.text}
        </p>
      ) : (
        <p className="text-[#8B94A7] text-xs mt-1">-</p>
      )}
    </div>
  )
}

const MONTHLY_PROD_BADGE_CLASS: Record<'success' | 'warning' | 'danger' | 'none', string> = {
  success: 'bg-emerald-900/30 text-emerald-400',
  warning: 'bg-amber-900/30 text-amber-400',
  danger:  'bg-red-900/30 text-red-400',
  none:    'bg-[#1E293B] text-[#8B94A7]',
}
const MONTHLY_PROD_BADGE_LABEL: Record<'success' | 'warning' | 'danger' | 'none', string> = {
  success: '優良', warning: '標準', danger: '危険', none: '未設定',
}

function MonthlyProdCard({
  value, status, missing,
}: {
  value: string
  status: 'success' | 'warning' | 'danger' | 'none'
  missing: boolean
}) {
  return (
    <div className="col-span-2 bg-[#0B1220] rounded-xl p-3 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[#8B94A7] text-xs">月次生産性（暫定）</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${MONTHLY_PROD_BADGE_CLASS[status]}`}>
          {MONTHLY_PROD_BADGE_LABEL[status]}
        </span>
      </div>
      <p className="text-[#E6ECF5] text-2xl font-bold">{value}</p>
      {missing && <p className="text-[#8B94A7] text-xs mt-1">月次設定を確認</p>}
    </div>
  )
}
