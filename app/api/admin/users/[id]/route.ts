import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: { user } } = await db.auth.admin.getUserById(params.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await db.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({ adminId: session.id, action: 'user_delete', entityType: 'user', entityId: params.id, details: { email: user.email } })
  return NextResponse.json({ ok: true })
}
