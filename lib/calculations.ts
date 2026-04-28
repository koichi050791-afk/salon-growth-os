export function calcStoreProdactivity(sales: number, totalLaborHours: number | null | undefined): number | null {
  if (!totalLaborHours || totalLaborHours <= 0) return null
  return Math.round(sales / totalLaborHours)
}

export function calcStaffProductivity(sales: number | null | undefined, laborHours: number | null | undefined): number | null {
  if (!sales || sales <= 0) return null
  if (!laborHours || laborHours <= 0) return null
  return Math.round(sales / laborHours)
}

export function formatProductivity(value: number | null): string {
  if (value === null) return '—'
  return `¥${value.toLocaleString()}/h`
}

/**
 * 月次生産性を計算する（週次ベース）
 * 月間予測売上 = （月累計売上 ÷ 入力済み週数）× 月の総週数
 * 月次生産性 = 月間予測売上 ÷ 稼働スタッフ人数
 *
 * @param monthlySales 月累計売上（入力済み週の合計・円）
 * @param completedWeeks 入力済みの週数（整数）
 * @param totalWeeks 月の総週数（monthly_configsのtotal_weeks）
 * @param activeStaffCount 稼働スタッフ人数（monthly_configsのactive_staff_count）
 * @returns 月次生産性（円）または null
 */
export function calcMonthlyProductivity(
  monthlySales: number,
  completedWeeks: number,
  totalWeeks: number | null | undefined,
  activeStaffCount: number | null | undefined
): number | null {
  if (!monthlySales || monthlySales <= 0) return null
  if (!completedWeeks || completedWeeks <= 0) return null
  if (!totalWeeks || totalWeeks <= 0) return null
  if (!activeStaffCount || activeStaffCount <= 0) return null

  const projectedMonthlySales = (monthlySales / completedWeeks) * totalWeeks
  return Math.round(projectedMonthlySales / activeStaffCount)
}

export function calcElapsedWorkingDays(today: Date): number {
  const year = today.getFullYear()
  const month = today.getMonth()
  let count = 0

  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(year, month, d)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 1) {
      count++
    }
  }
  return count
}

export function formatMonthlyProductivity(value: number | null): string {
  if (value === null) return '—'
  return `¥${value.toLocaleString()}`
}

export function getMonthlyProductivityStatus(value: number | null): 'success' | 'warning' | 'danger' | 'none' {
  if (value === null) return 'none'
  if (value < 900000) return 'danger'
  if (value < 1000000) return 'warning'
  return 'success'
}

/**
 * 週次売上を日割り按分して指定月に帰属する売上を返す
 * 例：4/28〜5/4の週（7日）に売上89万円の場合
 *   4月分 = 3日 ÷ 7日 × 89万 = 38.1万
 *   5月分 = 4日 ÷ 7日 × 89万 = 50.9万
 *
 * @param weekStart 週の開始日（ISO形式 YYYY-MM-DD、日曜日）
 * @param sales その週の売上
 * @param targetMonth 帰属させたい月（YYYY-MM形式）
 * @returns その月に按分された売上（円・小数点以下切り捨て）
 */
export function calcProratedSales(
  weekStart: string,
  sales: number,
  targetMonth: string
): number {
  const weekStartDate = new Date(weekStart)
  // 週の終了日（土曜日）
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)

  const [year, month] = targetMonth.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0) // 月末日

  // 週と月の重複期間を計算
  const overlapStart = weekStartDate > monthStart ? weekStartDate : monthStart
  const overlapEnd = weekEndDate < monthEnd ? weekEndDate : monthEnd

  if (overlapStart > overlapEnd) return 0

  const overlapDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalWeekDays = 7

  return Math.floor(sales * overlapDays / totalWeekDays)
}

/**
 * 週次データの配列から指定月の按分済み月累計売上を計算する
 *
 * @param weeklyInputs weekly_store_inputsの配列（week_startとsalesを含む）
 * @param targetMonth 対象月（YYYY-MM形式）
 * @returns 按分済み月累計売上（円）または null
 */
export function calcProratedMonthlySales(
  weeklyInputs: Array<{ week_start: string; sales: number | null }>,
  targetMonth: string
): number | null {
  const relevant = weeklyInputs.filter((w) => {
    if (w.sales === null) return false
    const weekStartDate = new Date(w.week_start)
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    const [year, month] = targetMonth.split('-').map(Number)
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)
    // 週が対象月と重複しているか
    return weekEndDate >= monthStart && weekStartDate <= monthEnd
  })

  if (relevant.length === 0) return null

  const total = relevant.reduce((sum, w) => {
    return sum + calcProratedSales(w.week_start, w.sales!, targetMonth)
  }, 0)

  return total
}
