# staffingatlas.online

Contractor Management SaaS for US/AU/UK companies managing offshore contractors.
Brand: StaffingAtlas | Navy + Amber | Inter Bold
Stack: Next.js 14 App Router + Supabase (@supabase/ssr) + Stripe + Resend + Vercel

SEPARATE from staffingatlas.com (the agency/marketing WordPress site).
SEPARATE accounts: own Supabase project, own Stripe account, own Vercel project.

## Session Start Protocol

1. Read `.claude/ARCHITECTURE_MAP.md` -- understand the data model and routes
2. Read `.claude/COMMON_MISTAKES.md` -- avoid known bugs
3. Read `.claude/QUICK_START.md` -- use correct commands

## Codebase Navigation -- MANDATORY

You MUST use token-savior MCP tools FIRST for any code lookup.

- ALWAYS start with: find_symbol, get_function_source, get_class_source,
  search_codebase, get_dependencies, get_dependents, get_change_impact
- Only fall back to Read/Grep when token-savior tools genuinely don't cover it
- If you are about to run grep to find code, STOP and use find_symbol instead

## Tech Stack

- Framework: Next.js 14 (App Router, TypeScript)
- Database + Auth: Supabase + @supabase/ssr (NOT auth-helpers-nextjs -- deprecated)
- Payments: Stripe ($49/$99/$199/mo -- Starter/Growth/Enterprise)
- Email: Resend
- Hosting: Vercel
- Styling: Tailwind CSS

## Critical Rules

1. Server Components are async, no hooks, no 'use client'
2. Client Components need 'use client', no async/await at component level
3. Supabase: use createBrowserClient (client) and createServerClient (server) from @supabase/ssr
4. Always enable RLS on new Supabase tables -- company_id isolation is critical
5. Never expose SUPABASE_SERVICE_ROLE_KEY to client
6. Verify Stripe webhook signature -- use raw body (req.text() not req.json())
7. Read subscription status from DB (synced via webhook), never from Stripe API directly
8. No cross-company data leaks -- verify RLS before every launch
