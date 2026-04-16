import { createClient } from '../supabase/server'
import type {
  DailyRecord,
  DailyRecordInsert,
  DailyRecordUpdate,
  RepositoryResult,
  RepositoryListResult,
} from '../types/db'

export async function getDailyRecordsByRange(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<RepositoryListResult<DailyRecord>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('store_id', storeId)
    .gte('record_date', startDate)
    .lte('record_date', endDate)
    .order('record_date')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getDailyRecordsByMonth(
  storeId: string,
  yearMonth: string
): Promise<RepositoryListResult<DailyRecord>> {
  const startDate = `${yearMonth}-01`
  const [year, month] = yearMonth.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return getDailyRecordsByRange(storeId, startDate, endDate)
}

export async function getDailyRecord(
  storeId: string,
  recordDate: string
): Promise<RepositoryResult<DailyRecord>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_records')
    .select('*')
    .eq('store_id', storeId)
    .eq('record_date', recordDate)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }
  return { data: data ?? null, error: error?.message ?? null }
}

export async function upsertDailyRecord(
  record: DailyRecordInsert
): Promise<RepositoryResult<DailyRecord>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_records')
    .upsert(record, { onConflict: 'store_id,record_date' })
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function updateDailyRecord(
  id: string,
  updates: DailyRecordUpdate
): Promise<RepositoryResult<DailyRecord>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('daily_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export type MonthlyAggregation = {
  total_sales: number
  total_customers: number
  record_count: number
  avg_daily_sales: number
  avg_daily_customers: number
}

export async function aggregateMonthlyRecords(
  storeId: string,
  yearMonth: string
): Promise<RepositoryResult<MonthlyAggregation>> {
  const { data: records, error } = await getDailyRecordsByMonth(storeId, yearMonth)

  if (error) {
    return { data: null, error }
  }

  if (records.length === 0) {
    return {
      data: {
        total_sales: 0,
        total_customers: 0,
        record_count: 0,
        avg_daily_sales: 0,
        avg_daily_customers: 0,
      },
      error: null,
    }
  }

  const total_sales = records.reduce((sum, r) => sum + r.sales_amount, 0)
  const total_customers = records.reduce((sum, r) => sum + r.customer_count, 0)
  const record_count = records.length

  return {
    data: {
      total_sales,
      total_customers,
      record_count,
      avg_daily_sales: total_sales / record_count,
      avg_daily_customers: total_customers / record_count,
    },
    error: null,
  }
}
