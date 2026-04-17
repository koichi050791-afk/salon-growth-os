import Link from 'next/link'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import type { MonthlyConfig } from '@/lib/types/db'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'

function fmt(val: number | null, suffix = ''): string {
  if (val === null) return '—'
  return val.toLocaleString('ja-JP') + suffix
}

export default async function Home() {
  const { data: stores } = await getActiveStores()

  const storeConfigs = await Promise.all(
    stores.map(async (store) => {
      const { data: config } = await getLatestMonthlyConfig(store.id)
      return { store, config }
    })
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 pb-20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Salon Growth OS</h1>
            <p className="text-gray-400 text-sm mt-0.5">店舗の目標管理ダッシュボード</p>
          </div>

          {storeConfigs.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 py-12 text-center">
              <p className="text-gray-500 text-sm mb-4">店舗データがありません</p>
              <Link
                href="/settings"
                className="text-sm px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
              >
                設定から店舗を追加する
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {storeConfigs.map(({ store, config }) => (
                <StoreCard key={store.id} storeName={store.store_name} config={config} storeId={store.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

function StoreCard({
  storeName,
  config,
  storeId,
}: {
  storeName: string
  config: MonthlyConfig | null
  storeId: string
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{storeName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {config ? `対象月：${config.target_month}` : '基準値未設定'}
          </p>
        </div>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
        >
          編集
        </Link>
      </div>

      {config ? (
        <dl className="space-y-2 text-sm">
          <Row label="目標売上"    value={fmt(config.target_sales, '円')} />
          <Row label="目標客単価"  value={fmt(config.target_unit_price, '円')} />
          <Row label="目標来店数"  value={fmt(config.target_visits, '件')} />
          <Row label="目標生産性"  value={fmt(config.target_productivity)} />
          <Row label="目標再来率"  value={config.target_repeat_rate !== null ? `${config.target_repeat_rate}%` : '—'} />
        </dl>
      ) : (
        <p className="text-xs text-gray-600 py-2">月次基準値が登録されていません</p>
      )}

      <div className="flex gap-2 pt-1">
        <Link
          href={`/dashboard?storeId=${storeId}`}
          className="flex-1 text-center text-sm py-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors font-medium"
        >
          ダッシュボード
        </Link>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="flex-1 text-center text-sm py-2.5 border border-gray-700 rounded-xl text-gray-400 hover:border-gray-500 transition-colors"
        >
          月次基準値
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-300">{value}</dd>
    </div>
  )
}
