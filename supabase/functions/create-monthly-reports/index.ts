import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 毎月1日 15:00 UTC（= 翌日 00:00 JST）に実行
// Supabase Dashboard > Edge Functions > Schedules で設定: 0 15 1 * *

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 当月の月初日（year_month統一形式）
  const now = new Date()
  const yearMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .split('T')[0]

  // アクティブな全店舗を取得
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id')
    .eq('is_active', true)

  if (storesError) {
    console.error('stores取得エラー:', storesError.message)
    return new Response(JSON.stringify({ error: storesError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const store of stores ?? []) {
    const { error } = await supabase
      .from('monthly_reports')
      .insert({ store_id: store.id, year_month: yearMonth })

    if (error) {
      if (error.code === '23505') {
        // unique違反 = 既存レコードあり。冪等性を保つためスキップ
        skipped++
      } else {
        console.error(`store ${store.id} insert失敗:`, error.message)
        errors.push(`${store.id}: ${error.message}`)
      }
    } else {
      created++
    }
  }

  const result = { year_month: yearMonth, created, skipped, errors }
  console.log('create-monthly-reports 完了:', result)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
