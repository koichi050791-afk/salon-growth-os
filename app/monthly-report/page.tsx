import { AuthGuard } from '@/lib/components/AuthGuard'
import Navigation from '@/lib/components/Navigation'
import MonthlyReportClientPage from './MonthlyReportClientPage'
import OwnerLink from './OwnerLink'

export default function MonthlyReportPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0B1220] pb-24">
        <Navigation />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#E6ECF5]">📋 月次報告書</h1>
            <OwnerLink />
          </div>
          <MonthlyReportClientPage />
        </div>
      </div>
    </AuthGuard>
  )
}
