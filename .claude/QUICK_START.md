# staffingatlas.online -- Quick Start

Contractor Management SaaS. Separate Supabase/Vercel/Stripe accounts from all other ventures.

## Dev Environment

```
npm run dev
npx supabase start
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Install dependencies (first time)

```
npm install @supabase/ssr @supabase/supabase-js stripe @stripe/stripe-js resend
```

Do NOT install @supabase/auth-helpers-nextjs -- it is deprecated.

## Supabase

```
npx supabase db diff -f migration_name
npx supabase db push
npx supabase db reset
npx supabase gen types typescript --local > types/supabase.ts
npx supabase status
```

## Stripe

```
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
npx stripe trigger customer.subscription.created
npx stripe trigger invoice.payment_failed
```

## Vercel

```
vercel
vercel --prod
vercel env pull .env.local
```

## Build & Lint

```
npm run build
npm run lint
npx tsc --noEmit
```

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_ENTERPRISE=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://staffingatlas.online
```

## Accounts (all separate from other ventures)

- Supabase: staffingatlas project (own account or own org)
- Vercel: staffingatlas-online project
- Stripe: staffingatlas Stripe account
- Resend: staffingatlas domain/API key
- GitHub: staffingatlas.online repo
