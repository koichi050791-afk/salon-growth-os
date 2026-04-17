import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import WeeklyInputClient from './WeeklyInputClient'

export default async function WeeklyInputPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const { data: stores } = await getActiveStores()

  return (
    <AuthGuard>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">週次KPI入力</h1>
            <p className="text-sm text-gray-500 mt-0.5">週ごとの実績を記録します</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
            <WeeklyInputClient stores={stores} selectedStoreId={storeId ?? ''} />
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
