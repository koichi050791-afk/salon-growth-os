import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import WeeklyInputForm from './WeeklyInputForm'

export default async function WeeklyInputPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const { data: stores } = await getActiveStores()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">週次KPI入力</h1>
            <p className="text-gray-400 text-sm mt-0.5">週ごとの実績を記録します</p>
          </div>

          <WeeklyInputForm stores={stores} initialStoreId={storeId ?? ''} />
        </div>
      </div>
    </AuthGuard>
  )
}
