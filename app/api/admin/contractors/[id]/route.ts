import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

const EDITABLE = ['name', 'email', 'role', 'country', 'hourly_rate', 'currency', 'contract_type', 'pool_type', 'status'] as const

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db.from('contractors').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'contractor_update', entityType: 'contractor', entityId: params.id, details: updates })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: contractor } = await db.from('contractors').select('name, email').eq('id', params.id).maybeSingle()
  if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })

  const { error } = await db.from('contractors').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'contractor_delete', entityType: 'contractor', entityId: params.id, details: contractor })
  return NextResponse.json({ ok: true })
}
