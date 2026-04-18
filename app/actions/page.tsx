import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getServerProfile } from '@/lib/repositories/profiles'
import ActionsClient from './ActionsClient'

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const profile = await getServerProfile()
  const { data: allStores } = await getActiveStores()

  const isManager = profile?.role === 'manager'
  const managedStoreId = isManager ? (profile?.store_id ?? null) : null
  const stores = isManager && managedStoreId
    ? allStores.filter((s) => s.id === managedStoreId)
    : allStores

  const initialStoreId = isManager && managedStoreId
    ? managedStoreId
    : (storeId ?? stores[0]?.id ?? '')

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#E6ECF5]">改善アクション</h1>
            <p className="text-[#8B94A7] text-xs mt-0.5">今週の一手を記録・管理します</p>
          </div>
          <ActionsClient stores={stores} initialStoreId={initialStoreId} />
        </div>
      </div>
    </AuthGuard>
  )
}
