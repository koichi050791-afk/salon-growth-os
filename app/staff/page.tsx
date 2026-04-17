import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import StaffListClient from './StaffListClient'

export default async function StaffListPage() {
  const { data: stores } = await getActiveStores()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">スタッフ別</h1>
            <p className="text-gray-400 text-sm mt-0.5">週次KPIと異常検知</p>
          </div>

          <StaffListClient stores={stores} />
        </div>
      </div>
    </AuthGuard>
  )
}
