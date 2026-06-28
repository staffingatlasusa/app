import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { key: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { value } = await request.json()
  const db = createAdminClient()
  await db.from('platform_settings').upsert({ key: params.key, value, updated_by_admin_id: session.id, updated_at: new Date().toISOString() })
  await writeAuditLog({ adminId: session.id, action: 'setting_update', entityType: 'setting', entityId: params.key, details: { value } })
  return NextResponse.json({ ok: true })
}
