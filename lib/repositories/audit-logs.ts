import { createClient } from '../supabase/server'

type AuditParams = {
  action: string
  table_name: string
  record_id?: string
  new_data?: unknown
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      user_id:    user?.id ?? null,
      action:     params.action,
      table_name: params.table_name,
      record_id:  params.record_id ?? null,
      new_data:   params.new_data ?? null,
    })
  } catch (e) {
    console.error('audit log error:', e)
  }
}
