-- =====================================================================
-- Ian.Analyst Portfolio — Supabase schema
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helpers
-- ---------------------------------------------------------------------

-- The single source of truth for "who is the admin".
-- RLS policies, RPCs and storage policies all call this.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
     and lower(coalesce(auth.jwt() ->> 'email', '')) = 'ianearlbesanez@gmail.com';
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Content tables
-- ---------------------------------------------------------------------

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(12,2) not null default 0 check (price >= 0),
  currency    text not null default 'PHP',
  image_url   text,
  buy_url     text,                       -- external store link (Gumroad, Shopee, ...)
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  content      text not null default '',  -- Markdown
  cover_url    text,
  tags         text[] not null default '{}',
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts (published, published_at desc);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  image_url   text,
  icon        text,                       -- Font Awesome class, used when there is no image
  tech_stack  text[] not null default '{}',
  live_url    text,
  repo_url    text,
  status      text not null default 'live' check (status in ('live', 'in_progress', 'coming_soon')),
  featured    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.certificates (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  issuer         text not null,
  issue_date     date,
  description    text,
  image_url      text,                    -- certificate image / badge
  credential_url text,                    -- verify link or uploaded PDF
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  achieved_on date,
  icon        text default 'fa-solid fa-trophy',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.experiences (
  id          uuid primary key default gen_random_uuid(),
  company     text not null,
  role        text not null,
  location    text,
  start_date  date not null,
  end_date    date,                       -- NULL = "Present"
  description text,                       -- Markdown allowed (bullet lists)
  logo_url    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.affiliations (
  id           uuid primary key default gen_random_uuid(),
  organization text not null,
  role         text,
  details      text,
  logo_url     text,
  url          text,
  start_date   date,
  end_date     date,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Analytics: one row per visit (deduplicated per browser session, see track_view()).
create table if not exists public.profile_views (
  id         bigint generated always as identity primary key,
  session_id text not null,
  path       text not null default '/',
  referrer   text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists profile_views_created_idx on public.profile_views (created_at desc);
create index if not exists profile_views_session_idx on public.profile_views (session_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['products','blog_posts','projects','certificates','achievements','experiences','affiliations']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Stamp published_at the first time a post is published.
create or replace function public.blog_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.published and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists blog_set_published_at on public.blog_posts;
create trigger blog_set_published_at before insert or update on public.blog_posts
  for each row execute function public.blog_set_published_at();

-- ---------------------------------------------------------------------
-- 4. Row Level Security
--    Public: read.  Admin (ianearlbesanez@gmail.com): insert/update/delete.
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['products','blog_posts','projects','certificates','achievements','experiences','affiliations']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('drop policy if exists "Admin insert" on public.%I', t);
    execute format('drop policy if exists "Admin update" on public.%I', t);
    execute format('drop policy if exists "Admin delete" on public.%I', t);

    execute format('create policy "Admin insert" on public.%I for insert to authenticated
                    with check ((select public.is_admin()))', t);
    execute format('create policy "Admin update" on public.%I for update to authenticated
                    using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "Admin delete" on public.%I for delete to authenticated
                    using ((select public.is_admin()))', t);

    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Always-public tables
create policy "Public read" on public.projects     for select to anon, authenticated using (true);
create policy "Public read" on public.certificates for select to anon, authenticated using (true);
create policy "Public read" on public.achievements for select to anon, authenticated using (true);
create policy "Public read" on public.experiences  for select to anon, authenticated using (true);
create policy "Public read" on public.affiliations for select to anon, authenticated using (true);

-- Drafts and hidden products are only visible to the admin
create policy "Public read" on public.blog_posts for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "Public read" on public.products for select to anon, authenticated
  using (is_active or (select public.is_admin()));

-- profile_views: nobody can write directly (only through track_view()),
-- and only the admin can read.
alter table public.profile_views enable row level security;
drop policy if exists "Admin read views" on public.profile_views;
create policy "Admin read views" on public.profile_views for select to authenticated
  using ((select public.is_admin()));
revoke all on public.profile_views from anon, authenticated;
grant select on public.profile_views to authenticated;

-- ---------------------------------------------------------------------
-- 5. Analytics RPCs
-- ---------------------------------------------------------------------

-- Called by every visitor on page load. Counts at most one view per
-- browser session every 30 minutes, and never counts the admin.
create or replace function public.track_view(
  p_session_id text,
  p_path       text default '/',
  p_referrer   text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or length(p_session_id) not between 8 and 64 then
    return;
  end if;

  if public.is_admin() then
    return;
  end if;

  if exists (
    select 1 from public.profile_views
    where session_id = p_session_id
      and created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.profile_views (session_id, path, referrer, user_agent)
  values (p_session_id, left(coalesce(p_path, '/'), 200), left(p_referrer, 500), left(p_user_agent, 300));
end;
$$;

revoke all on function public.track_view(text, text, text, text) from public;
grant execute on function public.track_view(text, text, text, text) to anon, authenticated;

-- Aggregated stats for the admin dashboard (days are in Asia/Manila time).
create or replace function public.get_analytics()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result json;
  today date := (now() at time zone 'Asia/Manila')::date;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select json_build_object(
    'total_views',     (select count(*) from public.profile_views),
    'unique_visitors', (select count(distinct session_id) from public.profile_views),
    'views_today',     (select count(*) from public.profile_views
                         where (created_at at time zone 'Asia/Manila')::date = today),
    'views_7d',        (select count(*) from public.profile_views
                         where created_at >= now() - interval '7 days'),
    'daily', (
      select coalesce(json_agg(json_build_object('day', d.day, 'views', coalesce(v.views, 0)) order by d.day), '[]'::json)
      from (select generate_series((today - 13)::timestamp, today::timestamp, interval '1 day')::date as day) d
      left join (
        select (created_at at time zone 'Asia/Manila')::date as day, count(*) as views
        from public.profile_views
        where created_at >= now() - interval '15 days'
        group by 1
      ) v on v.day = d.day
    ),
    'top_paths', (
      select coalesce(json_agg(p), '[]'::json) from (
        select path, count(*) as views
        from public.profile_views
        group by path
        order by views desc
        limit 5
      ) p
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_analytics() from public;
grant execute on function public.get_analytics() to authenticated;

-- Let the admin dashboard receive new views live via Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.profile_views;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------
-- 6. Storage bucket for uploads (images + PDFs)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio', 'portfolio', true, 10485760,  -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "Portfolio public read"  on storage.objects;
drop policy if exists "Portfolio admin insert" on storage.objects;
drop policy if exists "Portfolio admin update" on storage.objects;
drop policy if exists "Portfolio admin delete" on storage.objects;

create policy "Portfolio public read" on storage.objects for select
  using (bucket_id = 'portfolio');
create policy "Portfolio admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (select public.is_admin()));
create policy "Portfolio admin update" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()))
  with check (bucket_id = 'portfolio' and (select public.is_admin()));
create policy "Portfolio admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (select public.is_admin()));
