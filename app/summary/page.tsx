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

  if (!profile?.store_id) redirect('/login')

  const { weeklyData, actionData, staffData } = await fetchSummaryData(profile.store_id)

  return <SummaryClient weeklyData={weeklyData} actionData={actionData} staffData={staffData} />
}
