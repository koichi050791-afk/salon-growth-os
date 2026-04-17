import Link from 'next/link'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getActiveStaffByStore } from '@/lib/repositories/staff'
import StoreSelect from '@/app/dashboard/StoreSelect'

export default async function StaffListPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>
}) {
  const { storeId } = await searchParams
  const { data: stores } = await getActiveStores()
  const staffList = storeId ? (await getActiveStaffByStore(storeId)).data : []

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">スタッフ一覧</h1>
            <p className="text-gray-400 text-sm mt-0.5">各自の今週のアクションを確認できます</p>
          </div>

          {/* 店舗選択 */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">店舗</p>
            <StoreSelect stores={stores} selectedStoreId={storeId ?? ''} basePath="/staff" />
          </div>

          {storeId && (
            <div className="space-y-3">
              {staffList.length === 0 ? (
                <div className="bg-gray-900 rounded-2xl border border-gray-800 py-10 text-center text-gray-500 text-sm">
                  スタッフが登録されていません
                </div>
              ) : (
                staffList.map((s) => (
                  <Link
                    key={s.id}
                    href={`/staff/${s.id}`}
                    className="block bg-gray-900 rounded-2xl border border-gray-800 p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-lg font-bold">{s.name}</span>
                      <span className="text-blue-400 text-sm">今週のアクション確認 →</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
