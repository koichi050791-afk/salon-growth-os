import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getServerProfile } from '@/lib/repositories/profiles'
import DashboardClient from './DashboardClient'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams

  const profile = await getServerProfile()
  if (profile?.role === 'staff' && profile.staff_id) {
    redirect(`/staff/${profile.staff_id}`)
  }

  const { data: stores } = await getActiveStores()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">ダッシュボード</h1>
            <p className="text-gray-400 text-sm mt-0.5">週次KPIと原因分解</p>
          </div>

          <DashboardClient stores={stores} initialStoreId={storeId ?? ''} />
        </div>
      </div>
    </AuthGuard>
  )
}
