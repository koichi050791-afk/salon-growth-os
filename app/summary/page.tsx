import { fetchSummaryData } from './actions'
import SummaryClient from './SummaryClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SummaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_id')
    .eq('id', user.id)
    .single()

  const storeId = profile?.store_id ?? '3347ffa3-d37b-4d02-83f1-bad34c678b64'

  const { weeklyData, actionData, staffData } = await fetchSummaryData(storeId)

  return <SummaryClient weeklyData={weeklyData} actionData={actionData} staffData={staffData} />
}
