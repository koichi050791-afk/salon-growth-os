'use client'

import { useRouter } from 'next/navigation'
import type { Store } from '@/lib/types/db'

type Props = {
  stores: Store[]
  selectedStoreId: string
  basePath?: string
}

export default function StoreSelect({ stores, selectedStoreId, basePath = '/dashboard' }: Props) {
  const router = useRouter()

  return (
    <select
      value={selectedStoreId}
      onChange={(e) => {
        const val = e.target.value
        router.push(val ? `${basePath}?storeId=${val}` : basePath)
      }}
      className="block w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      <option value="">-- 店舗を選択してください --</option>
      {stores.map((store) => (
        <option key={store.id} value={store.id}>
          {store.store_name}
        </option>
      ))}
    </select>
  )
}
