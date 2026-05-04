'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MonthlyReport } from '@/lib/types/db'

// 'YYYY-MM' → 'YYYY-MM-01'
function toDateStr(yearMonth: string): string {
  return `${yearMonth}-01`
}

export async function fetchMonthlyReport(storeId: string, yearMonth: string): Promise<{
  report: MonthlyReport | null
  error: string | null
}> {
  const supabase = await createClient()
  const yearMonthDate = toDateStr(yearMonth)

  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('store_id', storeId)
    .eq('year_month', yearMonthDate)
    .maybeSingle()

  if (error) return { report: null, error: error.message }
  return { report: data, error: null }
}

// 未保存の新規月用スタブ（id = '' で新規扱い）
export async function createEmptyReport(storeId: string, yearMonth: string): Promise<MonthlyReport> {
  const now = new Date().toISOString()
  return {
    id: '',
    store_id: storeId,
    year_month: `${yearMonth}-01`,
    staff_count: null,
    total_sales: null,
    tech_sales: null,
    retail_sales: null,
    tech_unit_price: null,
    tech_customer_count: null,
    new_customer_count: null,
    discount_rate: null,
    last_year_total_sales: null,
    last_year_tech_sales: null,
    last_year_retail_sales: null,
    target_total_sales: null,
    target_tech_sales: null,
    target_retail_sales: null,
    color_count: null,
    perm_count: null,
    straight_count: null,
    treatment_count: null,
    spa_count: null,
    machine_count: null,
    new_customer_visit: null,
    new_customer_repeat: null,
    new_repeat_rate: null,
    existing_customer_visit: null,
    existing_customer_repeat: null,
    existing_repeat_rate: null,
    repeat_rate_3m: null,
    repeat_rate_6m: null,
    adopted_actions: [],
    promoted_staff: null,
    product_requests: null,
    notes: null,
    submitted_by: null,
    submitted_at: null,
    created_at: now,
    updated_at: now,
  }
}

export type ReportFormData = {
  staff_count: number | null
  total_sales: number | null
  tech_sales: number | null
  retail_sales: number | null
  tech_customer_count: number | null
  new_customer_count: number | null
  discount_rate: number | null
  last_year_total_sales: number | null
  last_year_tech_sales: number | null
  last_year_retail_sales: number | null
  target_total_sales: number | null
  target_tech_sales: number | null
  target_retail_sales: number | null
  color_count: number | null
  perm_count: number | null
  straight_count: number | null
  treatment_count: number | null
  spa_count: number | null
  machine_count: number | null
  new_customer_visit: number | null
  new_customer_repeat: number | null
  existing_customer_visit: number | null
  existing_customer_repeat: number | null
  repeat_rate_3m: number | null
  repeat_rate_6m: number | null
  promoted_staff: string | null
  product_requests: string | null
  notes: string | null
}

// reportId が空文字のとき INSERT、それ以外は UPDATE
export async function saveMonthlyReport(
  reportId: string,
  storeId: string,
  yearMonth: string,
  formData: ReportFormData
): Promise<{ reportId: string | null; error: string | null }> {
  const supabase = await createClient()

  const tech_unit_price =
    formData.tech_sales && formData.tech_customer_count && formData.tech_customer_count > 0
      ? Math.round(formData.tech_sales / formData.tech_customer_count)
      : null

  const new_repeat_rate =
    formData.new_customer_visit && formData.new_customer_repeat && formData.new_customer_visit > 0
      ? Math.round((formData.new_customer_repeat / formData.new_customer_visit) * 10000) / 100
      : null

  const existing_repeat_rate =
    formData.existing_customer_visit &&
    formData.existing_customer_repeat &&
    formData.existing_customer_visit > 0
      ? Math.round((formData.existing_customer_repeat / formData.existing_customer_visit) * 10000) / 100
      : null

  const payload = {
    ...formData,
    tech_unit_price,
    new_repeat_rate,
    existing_repeat_rate,
  }

  revalidatePath('/monthly-report')
  revalidatePath('/monthly-report/list')

  if (reportId) {
    const { error } = await supabase
      .from('monthly_reports')
      .update(payload)
      .eq('id', reportId)
    return { reportId, error: error?.message ?? null }
  }

  const { data, error } = await supabase
    .from('monthly_reports')
    .upsert(
      { store_id: storeId, year_month: toDateStr(yearMonth), ...payload },
      { onConflict: 'store_id,year_month' }
    )
    .select('id')
    .single()
  return { reportId: data?.id ?? null, error: error?.message ?? null }
}

export async function submitMonthlyReport(reportId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '認証が必要です' }

  const { error } = await supabase
    .from('monthly_reports')
    .update({ submitted_by: user.id, submitted_at: new Date().toISOString() })
    .eq('id', reportId)
    .is('submitted_at', null)

  revalidatePath('/monthly-report')
  revalidatePath('/monthly-report/list')
  return { error: error?.message ?? null }
}

export type ReportListItem = {
  id: string
  store_id: string
  store_name: string
  year_month: string
  total_sales: number | null
  submitted_at: string | null
}

export async function fetchReportList(yearMonth: string): Promise<{
  reports: ReportListItem[]
  error: string | null
}> {
  const supabase = await createClient()
  const yearMonthDate = toDateStr(yearMonth)

  const { data, error } = await supabase
    .from('monthly_reports')
    .select('id, store_id, year_month, total_sales, submitted_at, stores(store_name)')
    .eq('year_month', yearMonthDate)

  if (error) return { reports: [], error: error.message }

  const reports: ReportListItem[] = (data ?? []).map((r: any) => ({
    id: r.id,
    store_id: r.store_id,
    store_name: r.stores?.store_name ?? '',
    year_month: r.year_month,
    total_sales: r.total_sales,
    submitted_at: r.submitted_at,
  }))

  reports.sort((a, b) => a.store_name.localeCompare(b.store_name, 'ja'))

  return { reports, error: null }
}
