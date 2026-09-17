-- =====================================================================
-- Portfolio CMS schema for Supabase (Postgres)
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- ---------- PROFILE (single row) ----------
create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  bio text not null,
  email text not null,
  linkedin text,
  github text,
  cv_url text,
  profile_image text,
  updated_at timestamptz not null default now()
);

-- ---------- SKILLS ----------
create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Data Analysis','Business Intelligence','Other')),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- PROJECTS ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  full_description text not null,
  technologies text[] not null default '{}',
  github_url text,
  live_url text,
  category text not null,
  project_date text not null,
  featured boolean not null default false,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- CERTIFICATIONS ----------
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  issue_date text not null,
  credential_url text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- EXPERIENCE ----------
create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  position text not null,
  start_date text not null,
  end_date text,            -- null = "Present"
  description text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- EDUCATION ----------
create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null,
  start_date text,
  end_date text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- INSIGHTS (optional short posts / data notes) ----------
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security: everyone can read, only authenticated (admin) can write.
-- This project has exactly one admin user (created via Supabase Auth),
-- so "authenticated" is equivalent to "the admin" here.
-- =====================================================================

alter table profile enable row level security;
alter table skills enable row level security;
alter table projects enable row level security;
alter table certificates enable row level security;
alter table experience enable row level security;
alter table education enable row level security;
alter table insights enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['profile','skills','projects','certificates','experience','education','insights']
  loop
    execute format('create policy "public_read_%1$s" on %1$s for select using (true);', t);
    execute format('create policy "admin_write_%1$s" on %1$s for insert with check (auth.role() = ''authenticated'');', t);
    execute format('create policy "admin_update_%1$s" on %1$s for update using (auth.role() = ''authenticated'');', t);
    execute format('create policy "admin_delete_%1$s" on %1$s for delete using (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- =====================================================================
-- Storage: create a public bucket for project images, certificate images,
-- and the profile photo/CV. Run once (safe to re-run).
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do nothing;

create policy "public_read_assets" on storage.objects
  for select using (bucket_id = 'portfolio-assets');

create policy "admin_upload_assets" on storage.objects
  for insert with check (bucket_id = 'portfolio-assets' and auth.role() = 'authenticated');

create policy "admin_update_assets" on storage.objects
  for update using (bucket_id = 'portfolio-assets' and auth.role() = 'authenticated');

create policy "admin_delete_assets" on storage.objects
  for delete using (bucket_id = 'portfolio-assets' and auth.role() = 'authenticated');

-- =====================================================================
-- Next step (do this after running this file):
-- 1) Supabase Dashboard -> Authentication -> Users -> Add user
--    Create the one admin account (email + password) that will log in at /admin
-- 2) Copy Project Settings -> API -> Project URL + anon public key
--    into your .env.local (see .env.example)
-- 3) Seed the tables above with your real content from the Admin Panel,
--    or insert rows directly here in the SQL editor.
-- =====================================================================
