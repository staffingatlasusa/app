'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Use in: 'use client' components only.
 * Uses the anon key + RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
