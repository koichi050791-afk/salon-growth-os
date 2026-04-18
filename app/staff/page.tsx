import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getServerProfile } from '@/lib/repositories/profiles'
import StaffListClient from './StaffListClient'

export default async function StaffListPage() {
  const profile = await getServerProfile()

  const isManager = profile?.role === 'manager'
  const managedStoreId = isManager ? (profile?.store_id ?? null) : null

  const { data: allStores } = await getActiveStores()
  const stores = isManager && managedStoreId
    ? allStores.filter((s) => s.id === managedStoreId)
    : allStores

  const initialStoreId = isManager && managedStoreId ? managedStoreId : ''

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#E6ECF5]">スタッフ成長サポート</h1>
            <p className="text-[#8B94A7] text-sm mt-0.5">各スタッフの傾向と気づき</p>
          </div>

          <StaffListClient
            stores={stores}
            initialStoreId={initialStoreId}
            hideStoreSelect={isManager}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
