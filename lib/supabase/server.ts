import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 * Use in: Server Components, Route Handlers, Server Actions.
 * Uses the anon key + RLS — respects row-level security.
 */
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only, ignore
          }
        },
      },
    }
  )
}

/**
 * Admin client — bypasses RLS entirely.
 * Use ONLY in trusted server-side code (webhooks, admin ops).
 * NEVER import this in client components or expose to the browser.
 */
export function createAdminClient() {
  const { createClient: create } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-require-imports
  return create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
