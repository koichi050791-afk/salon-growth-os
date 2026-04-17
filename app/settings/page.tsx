import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import SettingsForm from './SettingsForm'
import { AuthGuard } from '@/lib/components/AuthGuard'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams

  const { data: stores } = await getActiveStores()

  let config = null
  if (storeId) {
    const result = await getLatestMonthlyConfig(storeId)
    config = result.data
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">設定</h1>
          <p className="text-sm text-gray-500 mb-8">店舗の月次基準値を設定します</p>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <SettingsForm
              stores={stores}
              selectedStoreId={storeId ?? ''}
              config={config}
            />
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
