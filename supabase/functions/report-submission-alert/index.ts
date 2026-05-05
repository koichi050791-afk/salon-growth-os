import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 毎月6日 15:00 UTC（= 翌日 00:00 JST）に実行
// Supabase Dashboard > Edge Functions > Schedules で設定: 0 15 6 * *
//
// 必要な環境変数:
//   SUPABASE_URL              - 自動で設定される
//   SUPABASE_SERVICE_ROLE_KEY - 自動で設定される
//   RESEND_API_KEY            - Resend (https://resend.com) のAPIキー
//   EMAIL_FROM                - 送信元アドレス（例: noreply@yourdomain.com）

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 先月の月初日
  const now = new Date()
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const yearMonth = lastMonth.toISOString().split('T')[0]
  const displayMonth = yearMonth.slice(0, 7).replace('-', '年') + '月'

  // 先月分で未提出の報告書を店舗名つきで取得
  const { data: unsubmitted, error: reportsError } = await supabase
    .from('monthly_reports')
    .select('id, store_id, stores(store_name)')
    .eq('year_month', yearMonth)
    .is('submitted_at', null)

  if (reportsError) {
    console.error('未提出一覧取得エラー:', reportsError.message)
    return new Response(JSON.stringify({ error: reportsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!unsubmitted || unsubmitted.length === 0) {
    console.log(`${displayMonth}: 未提出なし`)
    return new Response(
      JSON.stringify({ year_month: yearMonth, message: '未提出なし' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 幹部スタッフのauth_user_idを取得
  const { data: executives, error: staffError } = await supabase
    .from('staff')
    .select('auth_user_id')
    .eq('role', 'executive')
    .not('auth_user_id', 'is', null)

  if (staffError || !executives?.length) {
    console.error('幹部スタッフ取得エラー:', staffError?.message ?? '0件')
    return new Response(
      JSON.stringify({ error: '幹部ユーザーが見つかりません' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 各幹部のメールアドレスをAuth Adminから取得
  const emails: string[] = []
  for (const exec of executives) {
    const { data } = await supabase.auth.admin.getUserById(exec.auth_user_id)
    if (data?.user?.email) emails.push(data.user.email)
  }

  if (!emails.length) {
    console.error('幹部のメールアドレスが1件も取得できませんでした')
    return new Response(
      JSON.stringify({ error: '幹部のメールアドレスが取得できません' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // メール本文を組み立て
  const storeList = (unsubmitted as any[])
    .map((r) => `・${r.stores?.store_name ?? r.store_id}`)
    .join('\n')

  const subject = `【要確認】月次報告書 未提出店舗のお知らせ（${displayMonth}）`
  const text = [
    `${displayMonth}の月次報告書が未提出の店舗があります。`,
    '',
    storeList,
    '',
    `提出期限：${displayMonth}5日`,
    '早急にご確認ください。',
  ].join('\n')

  // Resend API でメール送信
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'noreply@example.com'

  if (!resendApiKey) {
    // 開発環境: コンソール出力のみ
    console.warn('RESEND_API_KEY未設定 - メール送信スキップ')
    console.log('送信先:', emails)
    console.log('件名:', subject)
    console.log('本文:', text)
  } else {
    // 幹部全員に一括送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: emails,
        subject,
        text,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend APIエラー:', err)
      return new Response(
        JSON.stringify({ error: 'メール送信失敗', detail: err }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  const result = {
    year_month: yearMonth,
    unsubmitted_count: unsubmitted.length,
    notified_executives: emails.length,
  }
  console.log('report-submission-alert 完了:', result)

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
