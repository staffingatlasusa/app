import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'
import { sendTemplatedEmail } from '@/lib/admin/email'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const { data: app } = await db.from('vetted_applications').select('contractor_id, contractors(email, name)').eq('id', params.id).single()
  await db.from('vetted_applications').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', params.id)
  if (app?.contractors) {
    const c = app.contractors as { email: string; name: string }
    try { await sendTemplatedEmail({ to: c.email, templateKey: 'vetting_rejected' }) } catch {}
  }
  await writeAuditLog({ adminId: session.id, action: 'vetting_reject', entityId: params.id })
  return NextResponse.json({ ok: true })
}
