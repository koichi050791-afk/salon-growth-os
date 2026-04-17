import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import { getActiveStores } from '@/lib/repositories/stores'
import { getActiveStaffByStore } from '@/lib/repositories/staff'
import StoreSelect from '@/app/dashboard/StoreSelect'
import Link from 'next/link'

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
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">スタッフ一覧</h1>
            <p className="text-sm text-gray-500 mt-0.5">各自の今週のアクションを確認できます</p>
          </div>

          {/* 店舗選択 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">店舗</label>
            <StoreSelect stores={stores} selectedStoreId={storeId ?? ''} basePath="/staff" />
          </div>

          {storeId && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
              {staffList.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  スタッフが登録されていません
                </div>
              ) : (
                staffList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 md:px-5 py-4">
                    <span className="text-sm md:text-base font-medium text-gray-900">{s.name}</span>
                    <Link
                      href={`/staff/${s.id}`}
                      className="text-sm px-3 md:px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      今週のアクション確認
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
