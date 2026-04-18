'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/',              icon: '🏠', label: 'ホーム' },
  { href: '/weekly-input',  icon: '➕', label: '入力' },
  { href: '/overview',      icon: '🏢', label: '全店' },
  { href: '/staff',         icon: '👤', label: '育成' },
  { href: '/monthly-config', icon: '⚙️', label: '設定' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B1220]/95 backdrop-blur-lg border-t border-white/5">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-[#8B94A7]'
              }`}
            >
              <span className="text-xl leading-none mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] text-[#8B94A7] hover:text-[#E6ECF5] transition-colors"
        >
          <span className="text-xl leading-none mb-1">🚪</span>
          <span className="text-xs">ログアウト</span>
        </button>
      </div>
    </nav>
  )
}
