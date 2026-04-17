import { getActiveStores } from '@/lib/repositories/stores'
import { getMonthlyConfigsByStore } from '@/lib/repositories/monthly-configs'
import MonthlyConfigClient from './MonthlyConfigClient'
import { AuthGuard } from '@/lib/components/AuthGuard'

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
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">月次基準値</h1>
          <p className="text-sm text-gray-500 mb-8">店舗ごとの月次目標値を管理します</p>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <MonthlyConfigClient
              stores={stores}
              selectedStoreId={storeId ?? ''}
              configs={configs}
            />
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
