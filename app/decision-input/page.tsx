import type { Metadata } from 'next'
import { AuthGuard } from '@/lib/components/AuthGuard'
import DecisionInputClient from './DecisionInputClient'

export const metadata: Metadata = {
  title: '記録 | Salon Growth OS',
  description: 'Decision input for salon work',
}

export default function DecisionInputPage() {
  return (
    <AuthGuard>
      <DecisionInputClient />
    </AuthGuard>
  )
}
