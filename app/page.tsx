import Link from 'next/link'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import type { MonthlyConfig } from '@/lib/types/db'
import { AuthGuard } from '@/lib/components/AuthGuard'

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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salon Growth OS</h1>
            <p className="text-sm text-gray-500 mt-1">店舗の目標管理ダッシュボード</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/monthly-config"
              className="text-sm px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              月次基準値
            </Link>
            <Link
              href="/settings"
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              設定
            </Link>
          </div>
        </div>

        {/* 店舗カード一覧 */}
        {storeConfigs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-4">店舗データがありません</p>
            <Link
              href="/settings"
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              設定から店舗を追加する
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {storeConfigs.map(({ store, config }) => (
              <StoreCard key={store.id} storeName={store.store_name} config={config} storeId={store.id} />
            ))}
          </div>
        )}
      </div>
    </main>
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
      {/* 店舗名・対象月 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{storeName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {config ? `対象月：${config.target_month}` : '基準値未設定'}
          </p>
        </div>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
        >
          編集
        </Link>
      </div>

      {/* 目標値一覧 */}
      {config ? (
        <dl className="space-y-2 text-sm">
          <Row label="目標売上" value={fmt(config.target_sales, '円')} />
          <Row label="目標客単価" value={fmt(config.target_unit_price, '円')} />
          <Row label="目標来店数" value={fmt(config.target_visits, '件')} />
          <Row label="目標生産性" value={fmt(config.target_productivity)} />
          <Row
            label="目標再来率"
            value={config.target_repeat_rate !== null ? `${config.target_repeat_rate}%` : '—'}
          />
        </dl>
      ) : (
        <p className="text-xs text-gray-400 py-2">
          月次基準値が登録されていません
        </p>
      )}

      {/* リンクボタン */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/settings?storeId=${storeId}`}
          className="flex-1 text-center text-xs py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
        >
          設定
        </Link>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="flex-1 text-center text-xs py-1.5 border border-blue-300 rounded text-blue-600 hover:bg-blue-50 transition-colors"
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
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  )
}
