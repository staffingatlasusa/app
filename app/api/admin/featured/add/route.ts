import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { entity_type, entity_id } = await request.json()
  const db = createAdminClient()
  const { data: last } = await db.from('featured_placements').select('display_order').order('display_order', { ascending: false }).limit(1).single()
  await db.from('featured_placements').insert({
    entity_type, entity_id, display_order: (last?.display_order ?? 0) + 1,
    created_by_admin_id: session.id, is_active: true,
  })
  await writeAuditLog({ adminId: session.id, action: 'featured_add', entityType: entity_type, entityId: entity_id })
  return NextResponse.json({ ok: true })
}
