'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/weekly-input', label: '週次入力' },
  { href: '/staff', label: 'スタッフ' },
]

export default function Navigation() {
  const { signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.push('/login')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
        <div className="flex items-center overflow-x-auto gap-1 flex-shrink-0 min-w-0">
          <span className="text-sm font-bold text-gray-900 whitespace-nowrap mr-3 flex-shrink-0">
            Salon Growth OS
          </span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-1.5 rounded-md whitespace-nowrap flex-shrink-0 transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleSignOut}
          className="ml-3 flex-shrink-0 text-sm text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
        >
          ログアウト
        </button>
      </div>
    </nav>
  )
}
