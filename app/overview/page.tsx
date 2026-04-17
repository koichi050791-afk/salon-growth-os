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
      <div className="min-h-screen bg-slate-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">全店比較</h1>
            <p className="text-slate-400 text-sm mt-0.5">全店舗の週次KPIを横断確認</p>
          </div>

          <OverviewClient />
        </div>
      </div>
    </AuthGuard>
  )
}
