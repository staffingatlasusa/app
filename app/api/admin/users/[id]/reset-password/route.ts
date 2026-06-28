import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { password } = await request.json()
  const db = createAdminClient()

  if (password) {
    // Force-set password (superadmin only)
    if (session.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { error } = await db.auth.admin.updateUserById(params.id, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await writeAuditLog({ adminId: session.id, action: 'user_password_force_reset', entityType: 'user', entityId: params.id })
    return NextResponse.json({ ok: true, method: 'forced' })
  } else {
    // Send reset email
    const { data: user } = await db.auth.admin.getUserById(params.id)
    if (!user.user?.email) return NextResponse.json({ error: 'User has no email' }, { status: 400 })
    const { error } = await db.auth.admin.generateLink({ type: 'recovery', email: user.user.email })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await writeAuditLog({ adminId: session.id, action: 'user_password_reset_email', entityType: 'user', entityId: params.id })
    return NextResponse.json({ ok: true, method: 'email' })
  }
}
