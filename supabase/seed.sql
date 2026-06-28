-- ============================================================
-- Seed: 10 demo contractor profiles
-- Migrated from WordPress user meta (sa_* keys)
-- All approved, mix of vetted and marketplace
-- ============================================================

insert into public.contractor_profiles (
  display_name, email, role, bio, rate_usd, location, availability,
  skills, pool_type, profile_status, source,
  linkedin_url, portfolio_url, photo_url
) values

-- Tech
(
  'Miguel Santos',
  'm.santos@demo.staffingatlas',
  'Full-Stack Developer',
  '6 years building SaaS products for US startups. Full stack from DB schema to pixel-perfect UI. Strong in system design and code review.',
  22, 'Philippines', 'Full-time (40hr)',
  ARRAY['React','Node.js','TypeScript','PostgreSQL','AWS'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Anika Reyes',
  'a.reyes@demo.staffingatlas',
  'WordPress Developer',
  'Specialist in custom WP themes and plugin development. Delivered 80+ client sites across e-commerce, services, and media niches.',
  14, 'Philippines', 'Full-time (40hr)',
  ARRAY['WordPress','WooCommerce','PHP','Elementor','ACF','Figma'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Carlo Mendoza',
  'c.mendoza@demo.staffingatlas',
  'DevOps & Cloud Engineer',
  'AWS Solutions Architect certified. Manages cloud infra for 12 SaaS companies. Strong on cost optimization and security hardening.',
  28, 'Philippines', 'Part-time (20hr)',
  ARRAY['AWS','Docker','Kubernetes','Terraform','CI/CD','Linux'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Priya Nair',
  'p.nair@demo.staffingatlas',
  'Data Analyst',
  '4 years in e-commerce analytics and financial reporting for AU and US clients. Turns raw data into actionable dashboards fast.',
  18, 'South Asia', 'Full-time (40hr)',
  ARRAY['Python','SQL','Power BI','Excel','Looker','Google Sheets'],
  'marketplace', 'approved', 'wp_import',
  null, null, null
),

-- Operations / Customer Service
(
  'Jasmine Cruz',
  'j.cruz@demo.staffingatlas',
  'Executive Virtual Assistant',
  'EA to C-suite executives for 5 years. Expert at managing chaos — inbox zero, complex scheduling, and cross-functional coordination.',
  9, 'Philippines', 'Full-time (40hr)',
  ARRAY['Calendar management','Email triage','Asana','Notion','Slack','Travel booking'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Ramon Villanueva',
  'r.villanueva@demo.staffingatlas',
  'Customer Support Specialist',
  'Handled Tier 1-2 support for 3 SaaS companies. 97% CSAT average. Fast, calm under pressure, native-level written English.',
  8, 'Philippines', 'Full-time (40hr)',
  ARRAY['Zendesk','Intercom','Freshdesk','Live Chat','Email Support','SLA management'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Lena Bautista',
  'l.bautista@demo.staffingatlas',
  'Bookkeeper & Accounts VA',
  'CPA-qualified bookkeeper with 7 years managing accounts for AU and US SMEs. Certified in QuickBooks Online and Xero.',
  12, 'Philippines', 'Part-time (20hr)',
  ARRAY['QuickBooks','Xero','MYOB','Bank reconciliation','Payroll','AP/AR'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),

-- Creative
(
  'Isabel Garcia',
  'i.garcia@demo.staffingatlas',
  'Brand & Graphic Designer',
  'Brand designer with an eye for clean conversion-focused visual identity. Built brand systems for 50+ startups and agencies.',
  16, 'Latin America', 'Full-time (40hr)',
  ARRAY['Figma','Adobe Illustrator','Photoshop','Brand identity','Logo design','Canva'],
  'vetted', 'approved', 'wp_import',
  null, null, null
),
(
  'Dani Aquino',
  'd.aquino@demo.staffingatlas',
  'Social Media Manager',
  'Grew 3 brand accounts from 0 to 50k+ followers. Strong in short-form video, reel editing, and performance-driven paid social.',
  11, 'Philippines', 'Full-time (40hr)',
  ARRAY['Instagram','TikTok','LinkedIn','Facebook Ads','Canva','Buffer','Content calendars'],
  'marketplace', 'approved', 'wp_import',
  null, null, null
),
(
  'Kevin Torres',
  'k.torres@demo.staffingatlas',
  'Video Editor & Motion Designer',
  'Creates scroll-stopping content for YouTube and social media. 200+ long-form videos edited for US and AU content creators.',
  19, 'Philippines', 'Full-time (40hr)',
  ARRAY['Premiere Pro','After Effects','DaVinci Resolve','YouTube SEO','Thumbnail design'],
  'vetted', 'approved', 'wp_import',
  null, null, null
)

on conflict (email) do update set
  display_name   = excluded.display_name,
  role           = excluded.role,
  bio            = excluded.bio,
  rate_usd       = excluded.rate_usd,
  location       = excluded.location,
  availability   = excluded.availability,
  skills         = excluded.skills,
  pool_type      = excluded.pool_type,
  profile_status = excluded.profile_status,
  updated_at     = now();
