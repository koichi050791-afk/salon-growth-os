import { getDailyRecordsByRange } from '@/lib/repositories/daily-records'
import type { DailyRecord } from '@/lib/types/db'

export type TrendStatus = 'good' | 'warning' | 'danger'

export type TrendResult = {
  status: TrendStatus
  currentValue: number
  medianValue: number | null
  changeRate: number | null
}

export type IssueResult = {
  metric: string
  label: string
  trend: TrendResult
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function classifyStatus(current: number, med: number): TrendStatus {
  if (med === 0) return 'warning'
  const rate = (current - med) / med
  if (rate <= -0.15) return 'danger'
  if (rate >= 0.15) return 'good'
  return 'warning'
}

function getPast4WeeksRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 28)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function extractMetricValues(
  records: DailyRecord[],
  metric: string
): number[] {
  return records
    .map((r) => {
      if (metric === 'unit_price') {
        return r.visits && r.visits > 0 && r.sales !== null
          ? r.sales / r.visits
          : null
      }
      return r[metric as keyof DailyRecord] as number | null
    })
    .filter((v): v is number => v !== null)
}

export async function analyzeTrend(
  storeId: string,
  metric: string,
  currentValue: number
): Promise<TrendResult> {
  const { startDate, endDate } = getPast4WeeksRange()
  const { data: records } = await getDailyRecordsByRange(storeId, startDate, endDate)

  const pastValues = extractMetricValues(records, metric)
  const med = median(pastValues)

  if (med === null) {
    return { status: 'warning', currentValue, medianValue: null, changeRate: null }
  }

  const changeRate = med !== 0 ? (currentValue - med) / med : null
  const status = classifyStatus(currentValue, med)

  return { status, currentValue, medianValue: med, changeRate }
}

const METRICS: Array<{ key: string; label: string }> = [
  { key: 'unit_price', label: '客単価' },
  { key: 'repeat_rate', label: '次回予約率' },
  { key: 'review_count', label: '口コミ数' },
  { key: 'sales', label: '売上' },
  { key: 'visits', label: '客数' },
]

export async function getTopIssues(storeId: string): Promise<IssueResult[]> {
  const { startDate, endDate } = getPast4WeeksRange()
  const { data: records } = await getDailyRecordsByRange(storeId, startDate, endDate)

  if (records.length === 0) return []

  const latest = records[records.length - 1]

  const results: IssueResult[] = []

  for (const { key, label } of METRICS) {
    const currentValue =
      key === 'unit_price'
        ? latest.visits && latest.visits > 0 && latest.sales !== null
          ? latest.sales / latest.visits
          : null
        : (latest[key as keyof DailyRecord] as number | null)

    if (currentValue === null) continue

    const pastValues = extractMetricValues(records.slice(0, -1), key)
    const med = median(pastValues)

    if (med === null) continue

    const changeRate = med !== 0 ? (currentValue - med) / med : null
    const status = classifyStatus(currentValue, med)

    results.push({
      metric: key,
      label,
      trend: { status, currentValue, medianValue: med, changeRate },
    })
  }

  const dangerItems = results.filter((r) => r.trend.status === 'danger')
  dangerItems.sort((a, b) => (a.trend.changeRate ?? 0) - (b.trend.changeRate ?? 0))

  return dangerItems.slice(0, 2)
}
