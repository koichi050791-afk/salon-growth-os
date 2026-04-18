import Link from 'next/link'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import { getWeeklyStoreInput } from '@/lib/repositories/weekly-store-inputs'
import { getServerProfile } from '@/lib/repositories/profiles'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import type { WeeklyStoreInput, MonthlyConfig } from '@/lib/types/db'

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

type IssueResult = { issueLabel: string; action: string; isOk: boolean }

function diagnose(
  thisWeek: WeeklyStoreInput | null,
  lastWeek: WeeklyStoreInput | null,
): IssueResult {
  const ok = { issueLabel: '現状維持：今の取り組みを継続', action: '今週の取り組みを来週も継続する', isOk: true }

  if (!thisWeek) return ok

  const avail = thisWeek.availability_score ?? 0
  if (avail >= 4) {
    return { issueLabel: '平日集客施策不足', action: '平日限定クーポンをLINEで配信する', isOk: false }
  }

  const newC = thisWeek.new_customers ?? null
  const prevNewC = lastWeek?.new_customers ?? null
  if (newC !== null && prevNewC !== null && prevNewC > 0) {
    if ((newC - prevNewC) / prevNewC <= -0.3) {
      return { issueLabel: '新規不足', action: '仕上がり直後にその場でGoogleの口コミ投稿を案内する', isOk: false }
    }
  }

  const sales = thisWeek.sales ?? null
  const visits = thisWeek.visits ?? null
  const prevSales = lastWeek?.sales ?? null
  const prevVisits = lastWeek?.visits ?? null

  if (sales !== null && visits !== null && prevSales !== null && prevVisits !== null) {
    const salesDown = sales < prevSales
    const visitsDown = visits < prevVisits
    const unitPrice = visits > 0 ? sales / visits : null
    const prevUnitPrice = prevVisits > 0 ? prevSales / prevVisits : null

    if (salesDown && visitsDown) {
      return { issueLabel: '集客不足', action: '仕上がり直後にその場でGoogleの口コミ投稿を案内する', isOk: false }
    }
    if (!visitsDown && unitPrice !== null && prevUnitPrice !== null && unitPrice < prevUnitPrice) {
      return { issueLabel: '単価設計または提案不足', action: 'カラー前にケア提案を1回必ず入れる', isOk: false }
    }

    const nextVisit = thisWeek.next_visit_count ?? null
    const prevNextVisit = lastWeek?.next_visit_count ?? null
    if (nextVisit !== null && visits > 0 && prevNextVisit !== null && prevVisits > 0) {
      if (nextVisit / visits < (prevNextVisit / prevVisits) * 0.9) {
        return { issueLabel: '次回予約導線不足', action: '会計時の次回予約案内を徹底する', isOk: false }
      }
    }
  }

  return ok
}

export default async function Home() {
  const profile = await getServerProfile()
  const { data: stores } = await getActiveStores()

  const isManager = profile?.role === 'manager'
  const mainStore = isManager && profile?.store_id
    ? (stores.find((s) => s.id === profile.store_id) ?? stores[0])
    : stores[0]

  const thisWeekStart = getSundayISO()
  const lastWeekStart = prevWeekISO(thisWeekStart)

  const [thisWeek, lastWeek, configResult] = mainStore
    ? await Promise.all([
        getWeeklyStoreInput(mainStore.id, thisWeekStart),
        getWeeklyStoreInput(mainStore.id, lastWeekStart),
        getLatestMonthlyConfig(mainStore.id),
      ])
    : ([null, null, { data: null }] as const)

  const config = (configResult as { data: MonthlyConfig | null }).data ?? null
  const weeklyTargetSales = config?.target_sales != null ? Math.round(config.target_sales / 4) : null

  const sales = thisWeek?.sales ?? null
  const visits = thisWeek?.visits ?? null
  const unitPrice =
    sales !== null && visits !== null && visits > 0 ? Math.round(sales / visits) : null
  const prevSales = lastWeek?.sales ?? null
  const prevVisits = lastWeek?.visits ?? null
  const prevUnitPrice =
    prevSales !== null && (lastWeek?.visits ?? 0) > 0
      ? Math.round(prevSales / lastWeek!.visits!)
      : null

  const nextVisitCount = thisWeek?.next_visit_count ?? null
  const prevNextVisitCount = lastWeek?.next_visit_count ?? null
  const repeatRate =
    nextVisitCount !== null && visits !== null && visits > 0
      ? Math.round((nextVisitCount / visits) * 100)
      : null
  const prevRepeatRate =
    prevNextVisitCount !== null && prevVisits !== null && prevVisits > 0
      ? Math.round((prevNextVisitCount / prevVisits) * 100)
      : null

  const today = new Date()
  const dateLabel = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  const { issueLabel, action, isOk } = diagnose(thisWeek ?? null, lastWeek ?? null)
  const hasData = thisWeek !== null

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Salon Growth OS</h1>
            <p className="text-slate-400 text-sm mt-0.5">{dateLabel}</p>
          </div>

          {!mainStore ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl py-12 text-center">
              <p className="text-slate-500 text-sm mb-4">店舗データがありません</p>
              <Link
                href="/settings"
                className="text-sm px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:opacity-90 transition"
              >
                設定から店舗を追加する
              </Link>
            </div>
          ) : (
            <>
              {/* 今週速報カード */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white text-xl font-bold">{mainStore.store_name}</p>
                  <span className="bg-blue-600/30 text-blue-300 rounded-full px-3 py-1 text-xs">
                    今週速報
                  </span>
                </div>

                {!hasData ? (
                  <div className="text-center py-6">
                    <p className="text-slate-500 text-sm mb-4">今週のデータが未入力です</p>
                    <Link
                      href={`/weekly-input?storeId=${mainStore.id}`}
                      className="inline-block text-sm px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:opacity-90 transition"
                    >
                      週次入力へ →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                      label="週売上"
                      value={fmtYen(sales)}
                      diff={targetPct(sales, weeklyTargetSales) ?? diffPct(sales, prevSales)}
                    />
                    <MetricCard
                      label="客数"
                      value={visits !== null ? `${visits}人` : '—'}
                      diff={diffPct(visits, prevVisits)}
                    />
                    <MetricCard
                      label="客単価"
                      value={fmtYen(unitPrice)}
                      diff={diffPct(unitPrice, prevUnitPrice)}
                    />
                    <MetricCard
                      label="再来率"
                      value={repeatRate !== null ? `${repeatRate}%` : '—'}
                      diff={diffPct(repeatRate, prevRepeatRate)}
                    />
                  </div>
                )}
              </div>

              {hasData && (
                <>
                  {/* 今週の課題 */}
                  <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-800/40 rounded-2xl p-4 mt-4">
                    <p className="text-red-300 text-sm font-bold mb-1">⚠️ 今週の課題</p>
                    <p className="text-white text-lg font-bold">{issueLabel}</p>
                  </div>

                  {/* 来週の一手 */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-800/40 rounded-2xl p-4 mt-3">
                    <p className="text-blue-300 text-sm font-bold mb-1">🎯 来週の一手</p>
                    <p className="text-white text-lg font-bold">{action}</p>
                    <p className="text-slate-400 text-xs mt-2">この1つに集中してください</p>
                  </div>
                </>
              )}

              {/* ショートカット */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link
                  href={`/weekly-input?storeId=${mainStore.id}`}
                  className="text-center text-sm py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white hover:opacity-90 transition font-medium"
                >
                  ➕ 週次入力
                </Link>
                <Link
                  href={`/dashboard?storeId=${mainStore.id}`}
                  className="text-center text-sm py-3 border border-slate-700 rounded-xl text-slate-400 hover:border-slate-500 transition"
                >
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
  label,
  value,
  diff,
}: {
  label: string
  value: string
  diff: { text: string; up: boolean } | null
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {diff ? (
        <p className={`text-xs mt-1 ${diff.up ? 'text-green-400' : 'text-red-400'}`}>
          {diff.up ? '↑' : '↓'} {diff.text}
        </p>
      ) : (
        <p className="text-slate-500 text-xs mt-1">-</p>
      )}
    </div>
  )
}
