import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthGuard } from '@/lib/components/AuthGuard'
import { getServerProfile } from '@/lib/repositories/profiles'
import DecisionInputClient from './DecisionInputClient'

export const metadata: Metadata = {
  title: 'Decision記録 | 池田航一｜美容師OS',
  description: '現場のDecisionを3分以内で残す',
}

export default async function DecisionInputPage() {
  const profile = await getServerProfile()
  if (!profile) redirect('/login')

  return (
    <AuthGuard>
      <DecisionInputClient />
    </AuthGuard>
  )
}
