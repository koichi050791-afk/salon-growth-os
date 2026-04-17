import { getActiveStores } from '@/lib/repositories/stores'
import { getMonthlyConfigsByStore } from '@/lib/repositories/monthly-configs'
import MonthlyConfigClient from './MonthlyConfigClient'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'

export default async function MonthlyConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams

  const { data: stores } = await getActiveStores()

  const configs = storeId
    ? (await getMonthlyConfigsByStore(storeId)).data
    : []

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">月次基準値</h1>
            <p className="text-slate-400 text-sm mt-0.5">店舗ごとの月次目標値を管理します</p>
          </div>
          <MonthlyConfigClient
            stores={stores}
            selectedStoreId={storeId ?? ''}
            configs={configs}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
