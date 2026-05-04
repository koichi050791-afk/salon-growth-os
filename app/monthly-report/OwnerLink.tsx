'use client'

import { useAuth } from '@/lib/contexts/AuthContext'

export default function OwnerLink() {
  const { isOwner } = useAuth()
  if (!isOwner) return null
  return (
    <a
      href="/monthly-report/list"
      className="text-xs text-[#D4AF37] border border-[#D4AF37]/40 rounded-full px-3 py-1.5 hover:opacity-80 transition"
    >
      全店一覧 →
    </a>
  )
}
