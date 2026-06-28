import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { signAdminToken } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const db = createAdminClient()
    const { data: admin } = await db
      .from('admin_users')
      .select('id, email, name, role, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (!admin || !admin.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await db.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id)

    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })

    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    await writeAuditLog({ adminId: admin.id, action: 'admin_login', ipAddress: ip })

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/admin',
    })
    // Also set for /api/admin routes
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/api/admin',
    })
    return response
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
