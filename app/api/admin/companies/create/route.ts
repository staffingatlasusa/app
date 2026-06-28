import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, owner_email, industry, country, plan } = await request.json()
  if (!name || !owner_email) return NextResponse.json({ error: 'Name and owner email required' }, { status: 400 })

  const db = createAdminClient()

  // Find or create the owner user
  const { data: { users } } = await db.auth.admin.listUsers()
  let owner = users.find(u => u.email === owner_email.toLowerCase())

  if (!owner) {
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const { data, error } = await db.auth.admin.createUser({
      email: owner_email, password: tempPassword, email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    owner = data.user!
  }

  const { data: company, error } = await db.from('companies').insert({
    name, owner_id: owner.id, industry: industry ?? null,
    country: country ?? null, plan: plan ?? 'trial',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'company_create', entityType: 'company', entityId: company.id, details: { name, owner_email } })
  return NextResponse.json({ ok: true, company })
}
