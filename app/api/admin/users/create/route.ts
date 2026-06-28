import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, name, company_name } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  const db = createAdminClient()

  const { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (company_name && data.user) {
    await db.from('companies').insert({
      name: company_name,
      owner_id: data.user.id,
    })
  }

  await writeAuditLog({ adminId: session.id, action: 'user_create', entityType: 'user', entityId: data.user?.id, details: { email, company_name } })
  return NextResponse.json({ ok: true, user: data.user })
}
