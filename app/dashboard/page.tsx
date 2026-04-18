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

  // manager は自店舗のみ
  const isOwner = profile?.role === 'owner'
  const isManager = profile?.role === 'manager'
  const managedStoreId = isManager ? (profile?.store_id ?? null) : null

  // viewer はダッシュボードをそのまま表示（RLSがデータを制限）

  const { data: allStores } = await getActiveStores()

  // owner は全店舗、manager は自店舗のみ
  const stores = isOwner
    ? allStores
    : isManager && managedStoreId
      ? allStores.filter((s) => s.id === managedStoreId)
      : allStores

  const initialStoreId = isManager && managedStoreId
    ? managedStoreId
    : (storeId ?? '')

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#E6ECF5]">ダッシュボード</h1>
            <p className="text-[#8B94A7] text-xs mt-0.5">週次KPIと原因分解</p>
          </div>

          <DashboardClient
            stores={stores}
            initialStoreId={initialStoreId}
            hideStoreSelect={isManager}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
