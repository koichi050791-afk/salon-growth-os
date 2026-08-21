'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/', icon: '⌂', label: 'ホーム' },
  { href: '/decisions', icon: '◎', label: 'Decision' },
  { href: '/project', icon: '↗', label: '130万' },
]

export default function PersonalNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      router.push('/login')
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--paper-soft)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-sm text-[11px] transition ${
                active ? 'text-[var(--ink)]' : 'text-[var(--muted)]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`text-lg leading-none ${
                  active ? 'text-[var(--gold)]' : 'text-[var(--muted)]'
                }`}
              >
                {item.icon}
              </span>
              <span className={active ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-sm text-[11px] text-[var(--muted)] transition active:text-[var(--ink)]"
        >
          <span className="text-lg leading-none">↪</span>
          <span>ログアウト</span>
        </button>
      </div>
    </nav>
  )
}
