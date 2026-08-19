import type { Metadata } from 'next'
import { AuthGuard } from '@/lib/components/AuthGuard'
import DecisionInputClient from './DecisionInputClient'

export const metadata: Metadata = {
  title: 'Decision記録 | 池田航一｜美容師OS',
  description: '現場のDecisionを3分以内で残す',
}

export default function DecisionInputPage() {
  return (
    <AuthGuard>
      <DecisionInputClient />
    </AuthGuard>
  )
}
