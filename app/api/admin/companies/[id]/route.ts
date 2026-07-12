import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

const EDITABLE = ['name', 'industry', 'country', 'plan', 'trial_ends'] as const

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
  const { error } = await db.from('companies').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep the subscription contractor limit in sync when the plan changes manually
  if (typeof updates.plan === 'string') {
    const limits: Record<string, number> = { starter: 3, growth: 10, enterprise: 999999, trial: 3 }
    if (updates.plan in limits) {
      await db.from('subscriptions').upsert(
        { company_id: params.id, plan: updates.plan, contractor_limit: limits[updates.plan], status: updates.plan === 'trial' ? 'trialing' : 'active' },
        { onConflict: 'company_id' }
      )
    }
  }

  await writeAuditLog({ adminId: session.id, action: 'company_update', entityType: 'company', entityId: params.id, details: updates })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: company } = await db.from('companies').select('name').eq('id', params.id).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { error } = await db.from('companies').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'company_delete', entityType: 'company', entityId: params.id, details: { name: company.name } })
  return NextResponse.json({ ok: true })
}
