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

export function calcMonthlyProductivity(
  monthlySales: number,
  elapsedWorkingDays: number,
  totalWorkingDays: number | null | undefined,
  activeStaffCount: number | null | undefined
): number | null {
  if (!monthlySales || monthlySales <= 0) return null
  if (!elapsedWorkingDays || elapsedWorkingDays <= 0) return null
  if (!totalWorkingDays || totalWorkingDays <= 0) return null
  if (!activeStaffCount || activeStaffCount <= 0) return null

  const projectedMonthlySales = (monthlySales / elapsedWorkingDays) * totalWorkingDays
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

export function getMonthlyProductivityStatus(value: number | null): 'danger' | 'warning' | 'success' | 'none' {
  if (value === null) return 'none'
  if (value < 900000) return 'danger'
  if (value < 1000000) return 'warning'
  return 'success'
}
