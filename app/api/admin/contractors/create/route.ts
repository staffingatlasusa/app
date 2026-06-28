import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, role, company_id, hourly_rate, currency, contract_type, country, pool_type } = await request.json()
  if (!name || !email || !role || !company_id) return NextResponse.json({ error: 'Name, email, role and company required' }, { status: 400 })

  const db = createAdminClient()

  const { data: contractor, error } = await db.from('contractors').insert({
    name, email, role, company_id,
    hourly_rate: hourly_rate ?? 0,
    currency: currency ?? 'USD',
    contract_type: contract_type ?? 'fulltime',
    country: country ?? 'Philippines',
    pool_type: pool_type ?? 'marketplace',
    status: 'active',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'contractor_create', entityType: 'contractor', entityId: contractor.id, details: { name, email, company_id } })
  return NextResponse.json({ ok: true, contractor })
}
