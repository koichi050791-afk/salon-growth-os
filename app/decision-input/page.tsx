import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { getServerUser } from '@/lib/auth/server-user'
import DecisionInputClient from './DecisionInputClient'

export const metadata: Metadata = {
  title: 'Decision予備入力 | 池田航一｜美容師OS',
  description: '専用GPTを使えない場合の手動入力',
}

export default async function DecisionInputPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  return (
    <AuthGuard>
      <DecisionInputClient />
    </AuthGuard>
  )
}
