import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getServerProfile } from '@/lib/repositories/profiles'
import ConfirmClient from './ConfirmClient'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const profile = await getServerProfile()
  const { data: allStores } = await getActiveStores()

  const isManager = profile?.role === 'manager'
  const managedStoreId = isManager ? (profile?.store_id ?? null) : null

  const resolvedStoreId = isManager && managedStoreId
    ? managedStoreId
    : (storeId ?? allStores[0]?.id ?? '')

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#E6ECF5]">今週のアクションを決める</h1>
            <p className="text-[#8B94A7] text-xs mt-0.5">課題に合わせた施策を1つ選択します</p>
          </div>
          {resolvedStoreId ? (
            <ConfirmClient storeId={resolvedStoreId} />
          ) : (
            <div className="bg-[#111A2B] rounded-2xl p-6 border border-white/5 text-center">
              <p className="text-[#8B94A7] text-sm">店舗が見つかりません</p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
