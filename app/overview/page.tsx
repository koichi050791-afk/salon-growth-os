import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getServerProfile } from '@/lib/repositories/profiles'
import OverviewClient from './OverviewClient'

export default async function OverviewPage() {
  const profile = await getServerProfile()

  // owner以外は全店比較にアクセス不可
  if (profile && profile.role !== 'owner') {
    const storeId = profile.store_id
    redirect(storeId ? `/dashboard?storeId=${storeId}` : '/dashboard')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-[#E6ECF5]">全店比較</h1>
            <p className="text-[#8B94A7] text-xs mt-0.5">全店舗の週次KPIを横断確認</p>
          </div>

          <OverviewClient />
        </div>
      </div>
    </AuthGuard>
  )
}
