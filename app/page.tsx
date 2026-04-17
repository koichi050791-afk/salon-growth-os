import Link from 'next/link'
import { getActiveStores } from '@/lib/repositories/stores'
import { getLatestMonthlyConfig } from '@/lib/repositories/monthly-configs'
import type { MonthlyConfig } from '@/lib/types/db'
import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'

function fmtYen(val: number | null): string {
  if (val === null) return '—'
  return '¥' + val.toLocaleString('ja-JP')
}
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
      <div className="min-h-screen bg-slate-950 pb-20">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Salon Growth OS</h1>
            <p className="text-slate-400 text-sm mt-0.5">店舗の目標管理ダッシュボード</p>
          </div>

          {storeConfigs.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl py-12 text-center">
              <p className="text-slate-500 text-sm mb-4">店舗データがありません</p>
              <Link
                href="/settings"
                className="text-sm px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:opacity-90 transition"
              >
                設定から店舗を追加する
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{storeName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {config ? `対象月：${config.target_month}` : '基準値未設定'}
          </p>
        </div>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="text-xs text-blue-400 hover:text-blue-300 transition whitespace-nowrap"
        >
          編集
        </Link>
      </div>

      {config ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <MetricMini label="目標売上"   value={fmtYen(config.target_sales)} />
          <MetricMini label="目標客単価" value={fmtYen(config.target_unit_price)} />
          <MetricMini label="目標来店数" value={fmt(config.target_visits, '件')} />
          <MetricMini label="目標再来率" value={config.target_repeat_rate !== null ? `${config.target_repeat_rate}%` : '—'} />
        </div>
      ) : (
        <p className="text-xs text-slate-600 py-2 mb-4">月次基準値が登録されていません</p>
      )}

      <div className="flex gap-2">
        <Link
          href={`/dashboard?storeId=${storeId}`}
          className="flex-1 text-center text-sm py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-white hover:opacity-90 transition active:scale-[0.98] font-medium"
        >
          ダッシュボード
        </Link>
        <Link
          href={`/monthly-config?storeId=${storeId}`}
          className="flex-1 text-center text-sm py-2.5 border border-slate-700 rounded-xl text-slate-400 hover:border-slate-500 transition"
        >
          月次基準値
        </Link>
      </div>
    </div>
  )
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-white font-bold text-sm">{value}</p>
    </div>
  )
}
