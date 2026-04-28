'use client'

type WeeklyData = {
  week_start: string
  sales: number | null
  visits: number | null
  availability_score: number | null
  next_visit_count: number | null
  total_labor_hours: number | null
}

type ActionData = {
  week_start: string
  action_title: string
  status: string
  result_status: string | null
}

type StaffData = {
  week_start: string
  staff_id: string
  sales: number | null
  labor_hours: number | null
}

type Props = {
  weeklyData: WeeklyData[]
  actionData: ActionData[]
  staffData: StaffData[]
}

function getTrend(current: number | null, previous: number | null): '↑' | '↓' | '→' | '-' {
  if (current === null || previous === null) return '-'
  if (current > previous * 1.02) return '↑'
  if (current < previous * 0.98) return '↓'
  return '→'
}

function getTrendColor(trend: '↑' | '↓' | '→' | '-'): string {
  if (trend === '↑') return 'text-emerald-400'
  if (trend === '↓') return 'text-red-400'
  return 'text-[#8B94A7]'
}

function calcWeekProductivity(
  staffData: StaffData[],
  weekStart: string
): number | null {
  const weekStaff = staffData.filter(s => s.week_start === weekStart)
  const totalSales = weekStaff.reduce((sum, s) => sum + (s.sales ?? 0), 0)
  const totalHours = weekStaff.reduce((sum, s) => sum + (s.labor_hours ?? 0), 0)
  if (totalSales <= 0 || totalHours <= 0) return null
  return Math.round(totalSales / totalHours)
}

function getNextWeekStart(weekStart: string, allWeeks: string[]): string | null {
  const idx = allWeeks.indexOf(weekStart)
  if (idx === -1 || idx >= allWeeks.length - 1) return null
  return allWeeks[idx + 1]
}

function formatSales(value: number | null): string {
  if (value === null) return '-'
  return `¥${(value / 10000).toFixed(1)}万`
}

function calcUnitPrice(sales: number | null, visits: number | null): number | null {
  if (!sales || !visits || visits === 0) return null
  return Math.round(sales / visits)
}

function calcActionRate(actionData: ActionData[]): string {
  const confirmed = actionData.filter(a => ['in_progress', 'completed', 'skipped'].includes(a.status))
  const executed = actionData.filter(a => a.status === 'completed')
  if (confirmed.length === 0) return '-'
  return `${Math.round((executed.length / confirmed.length) * 100)}%`
}

export default function SummaryClient({ weeklyData, actionData, staffData }: Props) {
  const latest = weeklyData[weeklyData.length - 1] ?? null
  const first = weeklyData[0] ?? null
  const prev = weeklyData[weeklyData.length - 2] ?? null

  const latestUnitPrice = calcUnitPrice(latest?.sales ?? null, latest?.visits ?? null)
  const firstUnitPrice = calcUnitPrice(first?.sales ?? null, first?.visits ?? null)
  const prevUnitPrice = calcUnitPrice(prev?.sales ?? null, prev?.visits ?? null)

  const salesTrend = getTrend(latest?.sales ?? null, prev?.sales ?? null)
  const visitsTrend = getTrend(latest?.visits ?? null, prev?.visits ?? null)
  const unitPriceTrend = getTrend(latestUnitPrice, prevUnitPrice)

  const salesChange = latest?.sales && first?.sales
    ? Math.round((latest.sales - first.sales) / 10000)
    : null

  const unitPriceChange = latestUnitPrice && firstUnitPrice
    ? latestUnitPrice - firstUnitPrice
    : null

  const actionRate = calcActionRate(actionData)

  return (
    <div className="min-h-screen bg-[#0B1220] pb-24">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-[#E6ECF5]">📈 8週間サマリー</h1>

        {weeklyData.length < 2 && (
          <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/10">
            <p className="text-sm text-[#8B94A7]">データが2週分以上ないと表示できません</p>
          </div>
        )}

        {weeklyData.length >= 2 && (
          <>
            {/* Week1→現在の変化 */}
            <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/10 space-y-3">
              <h2 className="text-sm font-semibold text-[#8B94A7]">Week1→現在の変化</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">週売上</span>
                  <span className="text-[#E6ECF5] font-bold text-sm">
                    {formatSales(first?.sales ?? null)} → {formatSales(latest?.sales ?? null)}
                    {salesChange !== null && (
                      <span className={`ml-2 text-xs ${salesChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({salesChange >= 0 ? '+' : ''}{salesChange}万)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">週客数</span>
                  <span className="text-[#E6ECF5] font-bold text-sm">
                    {first?.visits ?? '-'}件 → {latest?.visits ?? '-'}件
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">客単価</span>
                  <span className="text-[#E6ECF5] font-bold text-sm">
                    {firstUnitPrice ? `¥${firstUnitPrice.toLocaleString()}` : '-'} → {latestUnitPrice ? `¥${latestUnitPrice.toLocaleString()}` : '-'}
                    {unitPriceChange !== null && (
                      <span className={`ml-2 text-xs ${unitPriceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ({unitPriceChange >= 0 ? '+' : ''}{unitPriceChange.toLocaleString()}円)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* 直近週のトレンド */}
            <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/10 space-y-3">
              <h2 className="text-sm font-semibold text-[#8B94A7]">直近週のトレンド（前週比）</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">週売上</span>
                  <span className={`text-2xl font-bold ${getTrendColor(salesTrend)}`}>{salesTrend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">週客数</span>
                  <span className={`text-2xl font-bold ${getTrendColor(visitsTrend)}`}>{visitsTrend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B94A7]">客単価</span>
                  <span className={`text-2xl font-bold ${getTrendColor(unitPriceTrend)}`}>{unitPriceTrend}</span>
                </div>
              </div>
            </section>

            {/* アクション実行率 */}
            <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/10">
              <h2 className="text-sm font-semibold text-[#8B94A7] mb-2">アクション実行率（8週累計）</h2>
              <p className="text-3xl font-bold text-[#D4AF37]">{actionRate}</p>
              <p className="text-xs text-[#8B94A7] mt-1">完了済み ÷ 確定済みアクション数</p>
            </section>

            {/* アクション×人時生産性 */}
            {(() => {
              const executedActions = actionData.filter(a => a.status === 'completed')
              const allWeeks = weeklyData.map(w => w.week_start)

              if (executedActions.length === 0) {
                return (
                  <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/10">
                    <h2 className="text-sm font-semibold text-[#8B94A7] mb-2">アクション×人時生産性</h2>
                    <p className="text-sm text-[#8B94A7]">実行済みアクションがまだありません</p>
                  </section>
                )
              }

              return (
                <section className="bg-[#111A2B] rounded-2xl p-4 border border-white/10 space-y-3">
                  <h2 className="text-sm font-semibold text-[#8B94A7]">アクション×人時生産性</h2>
                  <p className="text-xs text-[#8B94A7]">実行週→翌週の人時生産性変化</p>
                  <div className="space-y-4">
                    {executedActions.map((action, i) => {
                      const thisWeekProd = calcWeekProductivity(staffData, action.week_start)
                      const nextWeekStart = getNextWeekStart(action.week_start, allWeeks)
                      const nextWeekProd = nextWeekStart
                        ? calcWeekProductivity(staffData, nextWeekStart)
                        : null

                      const diff = thisWeekProd && nextWeekProd
                        ? nextWeekProd - thisWeekProd
                        : null

                      const arrow = diff === null ? '-'
                        : diff > 0 ? '↑'
                        : diff < 0 ? '↓'
                        : '→'

                      const arrowColor = diff === null ? 'text-[#8B94A7]'
                        : diff > 0 ? 'text-emerald-400'
                        : diff < 0 ? 'text-red-400'
                        : 'text-[#8B94A7]'

                      return (
                        <div key={i} className="border-l-2 border-[#D4AF37]/40 pl-3 space-y-1">
                          <p className="text-xs text-[#8B94A7]">{action.week_start}</p>
                          <p className="text-sm font-medium text-[#E6ECF5]">{action.action_title}</p>
                          <p className="text-sm text-[#E6ECF5]">
                            {thisWeekProd ? `¥${thisWeekProd.toLocaleString()}/h` : '-'}
                            {' → '}
                            {nextWeekProd ? `¥${nextWeekProd.toLocaleString()}/h` : '-'}
                            <span className={`ml-2 font-bold ${arrowColor}`}>{arrow}</span>
                            {diff !== null && (
                              <span className={`ml-1 text-xs ${arrowColor}`}>
                                ({diff > 0 ? '+' : ''}{diff.toLocaleString()}円/h)
                              </span>
                            )}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
