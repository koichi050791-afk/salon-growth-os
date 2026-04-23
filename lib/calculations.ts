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
