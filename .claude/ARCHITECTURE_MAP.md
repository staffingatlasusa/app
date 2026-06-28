# staffingatlas.online -- Architecture Map

Product: Contractor Management SaaS for US/AU/UK companies managing offshore contractors.
Brand: StaffingAtlas | Navy #1B3A6B + Amber #F4A020 | Inter Bold
Stack: Next.js 14 App Router + Supabase (@supabase/ssr) + Stripe + Resend + Vercel

IMPORTANT: This is a SEPARATE product from staffingatlas.com (the agency/marketing site).
staffingatlas.online = the SaaS app. staffingatlas.com = the public marketing/agency site.

## Directory Structure

```
staffingatlas.online/
|-- app/
|   |-- (auth)/
|   |   |-- login/
|   |   |-- signup/          # company registration
|   |   +-- forgot-password/
|   |-- (dashboard)/         # protected -- company owner view
|   |   |-- dashboard/       # overview: contractors, hours, spend
|   |   |-- contractors/     # roster list
|   |   |   +-- [id]/        # contractor profile + history
|   |   |-- contractors/new/ # add contractor form
|   |   |-- timesheets/      # weekly view, approve/reject
|   |   |-- tasks/           # kanban per contractor
|   |   |-- payroll/         # monthly summary, invoices, CSV/PDF
|   |   |-- messages/        # direct message contractors
|   |   +-- settings/        # account, billing, plan
|   |-- (contractor)/        # protected -- contractor portal
|   |   |-- portal/          # contractor dashboard
|   |   |-- portal/timesheets/ # submit hours
|   |   +-- portal/tasks/    # view assigned tasks
|   |-- (marketing)/         # public pages
|   |   |-- pricing/
|   |   +-- how-it-works/
|   +-- api/
|       |-- webhooks/stripe/
|       +-- auth/
|-- components/
|   |-- ui/
|   |-- dashboard/
|   |-- contractors/
|   +-- forms/
|-- lib/
|   |-- supabase/
|   |   |-- client.ts        # createBrowserClient ('use client' only)
|   |   |-- server.ts        # createServerClient (server + API routes)
|   |   +-- admin.ts         # service_role -- never expose to client
|   |-- stripe/
|   |   |-- client.ts
|   |   |-- prices.ts        # price IDs from env vars
|   |   +-- webhooks.ts
|   +-- resend/
|       +-- emails.ts
|-- types/
|   |-- supabase.ts          # npx supabase gen types typescript
|   +-- index.ts
|-- middleware.ts             # auth -- routes /dashboard/* and /portal/*
+-- supabase/
    |-- migrations/
    +-- seed.sql
```

## Database Schema (Rev 2)

```sql
companies      { id, name, owner_id, plan, industry, country, timezone, stripe_customer_id, created_at }
-- plan: starter | growth | enterprise

contractors    { id, company_id, user_id, name, email, role, department, country, timezone,
                 hourly_rate, currency, contract_type, start_date, end_date, status,
                 pool_type, profile_photo_url, source, created_at }
-- contract_type: fulltime | parttime | project
-- status: active | inactive | completed
-- pool_type: marketplace | vetted
-- source: staffingatlas | direct | other

timesheets     { id, contractor_id, company_id, date, hours_worked, task_description,
                 status, approved_by, rejection_reason, created_at }
-- status: pending | approved | rejected

tasks          { id, company_id, assigned_to, title, description, status, priority,
                 due_date, created_by, created_at }
-- status: todo | in_progress | review | done
-- priority: low | medium | high

performance_notes { id, company_id, contractor_id, note, rating, created_by, created_at }
-- rating: 1-5

payroll_summaries { id, company_id, contractor_id, period_start, period_end,
                    total_hours, total_amount, currency, status, created_at }
-- status: draft | approved | paid

invoices       { id, company_id, contractor_id, payroll_summary_id, invoice_number,
                 amount, currency, status, due_date, created_at }
-- status: draft | sent | paid
-- invoice_number: auto-generated

messages       { id, company_id, sender_id, recipient_id, content, read, created_at }

subscriptions  { id, company_id, stripe_subscription_id, plan, status, current_period_end }
-- status: active | past_due | canceled | trialing
```

## RLS Rules (critical -- no cross-company data leaks)

- All tables: filter by company_id -- users see only their own company data
- contractors: user_id = auth.uid() for portal access (contractor sees own rows only)
- timesheets/tasks/payroll/invoices: contractor sees only rows where contractor_id = their contractors.id
- messages: sender_id = auth.uid() OR recipient_id = auth.uid()
- VERIFY ALL RLS before launch

## Pricing Tiers

| Plan | Price | Contractors | Features |
|------|-------|-------------|---------|
| Starter | $49/mo | Up to 3 | Timesheets + Tasks |
| Growth | $99/mo | Up to 15 | + Payroll + Invoices + Messaging |
| Enterprise | $199/mo | Unlimited | + API + Priority support |

## Currencies Supported

USD, AUD, GBP, EUR, PHP

## Key Patterns

- createBrowserClient in 'use client' components
- createServerClient in server components, route handlers, middleware
- NEVER install @supabase/auth-helpers-nextjs -- it is deprecated
- Read subscription status from DB, never from Stripe API directly
- Use req.text() (not req.json()) before stripe.webhooks.constructEvent()
