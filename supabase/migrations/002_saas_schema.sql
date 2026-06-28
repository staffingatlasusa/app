-- ============================================================
-- StaffingAtlas SaaS Schema — Rev 1
-- Run in Supabase SQL editor on project oqkrqamijkoqvlceiswd
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── companies ───────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  plan        text not null default 'trial' check (plan in ('trial','starter','growth','enterprise')),
  industry    text,
  country     text,
  timezone    text default 'UTC',
  trial_ends  timestamptz default (now() + interval '14 days'),
  stripe_customer_id    text,
  stripe_subscription_id text,
  created_at  timestamptz default now()
);
alter table public.companies enable row level security;
create policy "owner_all" on public.companies
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ── contractors ─────────────────────────────────────────────
create table if not exists public.contractors (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete set null,
  name             text not null,
  email            text not null,
  role             text not null,
  department       text,
  country          text default 'Philippines',
  timezone         text default 'Asia/Manila',
  hourly_rate      numeric(10,2) not null default 0,
  currency         text not null default 'USD',
  contract_type    text not null default 'fulltime' check (contract_type in ('fulltime','parttime','project')),
  start_date       date,
  end_date         date,
  status           text not null default 'active' check (status in ('active','inactive','completed')),
  pool_type        text default 'marketplace' check (pool_type in ('marketplace','vetted')),
  profile_photo_url text,
  source           text default 'direct' check (source in ('staffingatlas','direct','other')),
  notes            text,
  created_at       timestamptz default now()
);
alter table public.contractors enable row level security;
-- Company sees all their contractors
create policy "company_all" on public.contractors
  using (company_id in (select id from public.companies where owner_id = auth.uid()));
-- Contractor sees only their own row
create policy "contractor_self" on public.contractors
  using (user_id = auth.uid());

-- ── timesheets ──────────────────────────────────────────────
create table if not exists public.timesheets (
  id               uuid primary key default gen_random_uuid(),
  contractor_id    uuid not null references public.contractors(id) on delete cascade,
  company_id       uuid not null references public.companies(id) on delete cascade,
  date             date not null,
  hours_worked     numeric(4,2) not null check (hours_worked >= 0 and hours_worked <= 24),
  task_description text,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by      uuid references auth.users(id),
  rejection_reason text,
  created_at       timestamptz default now(),
  unique(contractor_id, date)
);
alter table public.timesheets enable row level security;
create policy "company_all" on public.timesheets
  using (company_id in (select id from public.companies where owner_id = auth.uid()));
create policy "contractor_self" on public.timesheets
  using (contractor_id in (select id from public.contractors where user_id = auth.uid()));

-- ── tasks ───────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  assigned_to  uuid references public.contractors(id) on delete set null,
  title        text not null,
  description  text,
  status       text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority     text not null default 'medium' check (priority in ('low','medium','high')),
  due_date     date,
  position     integer default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "company_all" on public.tasks
  using (company_id in (select id from public.companies where owner_id = auth.uid()));
create policy "contractor_self" on public.tasks
  using (assigned_to in (select id from public.contractors where user_id = auth.uid()));

-- ── performance_notes ────────────────────────────────────────
create table if not exists public.performance_notes (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  note          text not null,
  rating        integer check (rating >= 1 and rating <= 5),
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now()
);
alter table public.performance_notes enable row level security;
create policy "company_all" on public.performance_notes
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ── payroll_summaries ────────────────────────────────────────
create table if not exists public.payroll_summaries (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  total_hours   numeric(8,2) not null default 0,
  total_amount  numeric(12,2) not null default 0,
  currency      text not null default 'USD',
  status        text not null default 'draft' check (status in ('draft','approved','paid')),
  created_at    timestamptz default now()
);
alter table public.payroll_summaries enable row level security;
create policy "company_all" on public.payroll_summaries
  using (company_id in (select id from public.companies where owner_id = auth.uid()));
create policy "contractor_self" on public.payroll_summaries
  using (contractor_id in (select id from public.contractors where user_id = auth.uid()));

-- ── invoices ────────────────────────────────────────────────
create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  contractor_id       uuid not null references public.contractors(id) on delete cascade,
  payroll_summary_id  uuid references public.payroll_summaries(id),
  invoice_number      text not null,
  amount              numeric(12,2) not null,
  currency            text not null default 'USD',
  status              text not null default 'draft' check (status in ('draft','sent','paid')),
  due_date            date,
  created_at          timestamptz default now()
);
alter table public.invoices enable row level security;
create policy "company_all" on public.invoices
  using (company_id in (select id from public.companies where owner_id = auth.uid()));
create policy "contractor_self" on public.invoices
  using (contractor_id in (select id from public.contractors where user_id = auth.uid()));

-- ── messages ────────────────────────────────────────────────
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  sender_id    uuid not null references auth.users(id),
  recipient_id uuid not null references auth.users(id),
  content      text not null,
  read         boolean not null default false,
  created_at   timestamptz default now()
);
alter table public.messages enable row level security;
create policy "participants_only" on public.messages
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "company_owner_all" on public.messages
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- ── realtime ────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.timesheets;
alter publication supabase_realtime add table public.tasks;
