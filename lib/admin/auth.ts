import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!)
const COOKIE = 'admin_session'

export type AdminSession = {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'support'
}

export async function signAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.ADMIN_JWT_EXPIRY ?? '8h')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const token = await signAdminToken(session)
  const cookieStore = cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/admin',
  })
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete(COOKIE)
}

export async function updateAdminLastLogin(adminId: string): Promise<void> {
  const db = createAdminClient()
  await db.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminId)
}
