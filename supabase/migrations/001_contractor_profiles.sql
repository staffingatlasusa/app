-- ============================================================
-- contractor_profiles
-- Public marketplace table — read-optimized, denormalized.
-- Source of truth for staffingatlas.com/talent/ browse page.
-- Separate from the `contractors` table (company-managed workforce).
-- ============================================================

create table if not exists public.contractor_profiles (
  id                uuid primary key default gen_random_uuid(),

  -- Identity
  display_name      text not null,
  email             text unique,                    -- not exposed via public API
  photo_url         text,

  -- Professional
  role              text not null,
  bio               text,
  rate_usd          integer not null default 0,     -- 0 = on request
  location          text not null default 'Philippines',
  availability      text not null default 'Full-time (40hr)',
                    -- 'Full-time (40hr)' | 'Part-time (20hr)' | 'Flexible'

  -- Skills stored as a text array for easy Postgres filtering
  skills            text[] not null default '{}',

  -- Links (not exposed via public API — linked from profile cards only)
  linkedin_url      text,
  portfolio_url     text,
  cv_url            text,

  -- Pool + status
  pool_type         text not null default 'marketplace',
                    -- 'marketplace' | 'vetted'
  profile_status    text not null default 'pending',
                    -- 'pending' | 'approved' | 'rejected'

  -- Auth link (set when contractor creates a SA account)
  user_id           uuid references auth.users(id) on delete set null,

  -- Source tracking
  source            text not null default 'wp_import',
                    -- 'wp_import' | 'direct_signup' | 'admin_created'

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- Indexes for the browse page filter dimensions
-- ============================================================

create index if not exists idx_cp_status
  on contractor_profiles(profile_status);

create index if not exists idx_cp_pool
  on contractor_profiles(pool_type);

create index if not exists idx_cp_location
  on contractor_profiles(location);

create index if not exists idx_cp_availability
  on contractor_profiles(availability);

create index if not exists idx_cp_rate
  on contractor_profiles(rate_usd);

-- GIN index for skills array containment queries (@> operator)
create index if not exists idx_cp_skills
  on contractor_profiles using gin(skills);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_cp_updated_at
  before update on contractor_profiles
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table contractor_profiles enable row level security;

-- Anyone can read approved profiles (used by the public /talent/ page)
create policy "public_read_approved"
  on contractor_profiles
  for select
  using (profile_status = 'approved');

-- A contractor can read their own row regardless of status
create policy "owner_read_own"
  on contractor_profiles
  for select
  using (user_id = auth.uid());

-- A contractor can update their own row
create policy "owner_update_own"
  on contractor_profiles
  for update
  using (user_id = auth.uid());

-- Service role can do anything (admin operations)
-- (service role bypasses RLS by default — no policy needed)

-- ============================================================
-- Comments
-- ============================================================

comment on table contractor_profiles is
  'Public marketplace profiles. Exposed via /api/contractors/public (approved only). '
  'Separate from contractors table which tracks company-managed workforce.';

comment on column contractor_profiles.rate_usd is
  '0 means "on request" — do not display as $0/hr on frontend.';

comment on column contractor_profiles.skills is
  'Denormalized text array. Use @> for containment: skills @> ARRAY[''React'']';

comment on column contractor_profiles.email is
  'Stored but never returned by the public API endpoint.';
