'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import MonthlyReportForm from './MonthlyReportForm'
import type { MonthlyReport, Store } from '@/lib/types/db'

function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function makeEmptyReport(storeId: string, yearMonth: string): MonthlyReport {
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

export default function MonthlyReportClientPage() {
  const { user, profile, loading: authLoading, isOwner } = useAuth()
  const searchParams = useSearchParams()

  const yearMonth = searchParams.get('yearMonth') ?? getCurrentYearMonth()
  const storeIdParam = searchParams.get('storeId')

  const [stores, setStores] = useState<Store[]>([])
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [storeId, setStoreId] = useState<string>('')
  const [storeName, setStoreName] = useState<string>('')
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user || !profile) return
    const currentProfile = profile
    let cancelled = false

    async function loadData() {
      setLoadingData(true)
      setDataError(null)

      try {
        const supabase = createClient()

        const [
          { data: storesData, error: storesError },
          { data: allReports }
        ] = await Promise.all([
          supabase.from('stores').select('*').eq('is_active', true).order('store_name'),
          supabase.from('monthly_reports').select('*').eq('year_month', `${yearMonth}-01`)
        ])

        if (cancelled) return

        if (storesError || !storesData?.length) {
          setDataError('店舗情報の取得に失敗しました。')
          return
        }

        setStores(storesData)

        const isManager = currentProfile.role === 'manager'
        let selectedStoreId: string
        if (isManager && currentProfile.storeId) {
          selectedStoreId = currentProfile.storeId
        } else {
          selectedStoreId = storeIdParam
            ? (storesData.find((s) => s.id === storeIdParam)?.id ?? storesData[0].id)
            : storesData[0].id
        }

        const selectedStore = storesData.find((s) => s.id === selectedStoreId) ?? storesData[0]
        setStoreId(selectedStore.id)
        setStoreName(selectedStore.store_name)

        const reportData = allReports?.find((r) => r.store_id === selectedStore.id) ?? null
        setReport(reportData ?? makeEmptyReport(selectedStore.id, yearMonth))
      } catch {
        if (!cancelled) {
          setDataError('データの取得中にエラーが発生しました。再度お試しください。')
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [authLoading, user?.id, profile?.role, profile?.storeId, storeIdParam, yearMonth])

  if (authLoading || loadingData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8B94A7] text-sm">読み込み中...</p>
      </div>
    )
  }

  if (!user) return null

  if (dataError) {
    return (
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 text-center">
        <p className="text-[#8B94A7] text-sm">{dataError}</p>
      </div>
    )
  }

  if (!profile || stores.length === 0) {
    return (
      <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5 text-center">
        <p className="text-[#8B94A7] text-sm">データを取得できませんでした。再度お試しください。</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8B94A7] text-sm">読み込み中...</p>
      </div>
    )
  }

  const effectiveReport = report

  return (
    <>
      {isOwner && stores.length > 1 && (
        <div className="bg-[#111A2B] rounded-2xl p-4 border border-white/5">
          <p className="text-sm text-[#8B94A7] mb-2">店舗切り替え</p>
          <div className="flex flex-wrap gap-2">
            {stores.map((s) => (
              <a
                key={s.id}
                href={`/monthly-report?storeId=${s.id}&yearMonth=${yearMonth}`}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  s.id === storeId
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold'
                    : 'text-[#8B94A7] border-white/10 hover:opacity-80'
                }`}
              >
                {s.store_name}
              </a>
            ))}
          </div>
        </div>
      )}

      <MonthlyReportForm
        initialReport={effectiveReport}
        storeName={storeName}
        storeId={storeId}
        yearMonth={yearMonth}
        isReadOnly={profile.role === 'viewer'}
      />
    </>
  )
}
