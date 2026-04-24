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
