import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const db = createAdminClient()
  await db.from('featured_placements').update({ is_active: false }).eq('id', id)
  await writeAuditLog({ adminId: session.id, action: 'featured_remove', entityId: id })
  return NextResponse.json({ ok: true })
}
