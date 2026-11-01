-- =====================================================================
-- Redesign update: profile settings, editable Expertise, blog gallery,
-- blog comments. Run once in: Supabase Dashboard -> SQL Editor.
-- Adds new things only. Your existing content is not changed.
-- Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Site settings (one row): profile picture and stats values
-- ---------------------------------------------------------------------

create table if not exists public.site_settings (
  id                  int primary key default 1 check (id = 1),
  profile_image_url   text,                 -- NULL = use the built-in portrait
  learning_since_year int not null default 2017 check (learning_since_year between 1980 and 2100),
  updated_at          timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists set_updated_at on public.site_settings;
create trigger set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
drop policy if exists "Public read" on public.site_settings;
drop policy if exists "Admin update" on public.site_settings;
create policy "Public read" on public.site_settings for select to anon, authenticated using (true);
create policy "Admin update" on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- ---------------------------------------------------------------------
-- 2. Expertise: skills with an uploaded logo or a Font Awesome icon
-- ---------------------------------------------------------------------

create table if not exists public.skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text,                          -- uploaded logo; wins over the icon
  icon       text default 'fa-solid fa-code',
  color      text,                          -- optional icon color, e.g. #F2C811
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.skills;
create trigger set_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

alter table public.skills enable row level security;
drop policy if exists "Public read"  on public.skills;
drop policy if exists "Admin insert" on public.skills;
drop policy if exists "Admin update" on public.skills;
drop policy if exists "Admin delete" on public.skills;
create policy "Public read"  on public.skills for select to anon, authenticated using (true);
create policy "Admin insert" on public.skills for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admin update" on public.skills for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.skills for delete to authenticated
  using ((select public.is_admin()));
grant select on public.skills to anon, authenticated;
grant insert, update, delete on public.skills to authenticated;

-- Starter list, only added when the table is empty.
insert into public.skills (name, icon, color, sort_order)
select v.name, v.icon, v.color, v.sort_order
from (values
  ('Power BI',       'fa-solid fa-chart-column', '#F2C811', 1),
  ('Excel',          'fa-solid fa-file-excel',   '#21A366', 2),
  ('SQL',            'fa-solid fa-database',     '#00B4D8', 3),
  ('PostgreSQL',     'fa-solid fa-server',       '#5B8DEF', 4),
  ('Python',         'fa-brands fa-python',      '#4B9CD3', 5),
  ('Power Query',    'fa-solid fa-filter',       '#F2C811', 6),
  ('Apps Script',    'fa-solid fa-gears',        '#34A853', 7),
  ('Power Automate', 'fa-solid fa-bolt',         '#2F96EF', 8),
  ('VBA',            'fa-solid fa-table-cells',  '#21A366', 9),
  ('JavaScript',     'fa-brands fa-js',          '#F7DF1E', 10),
  ('HTML5',          'fa-brands fa-html5',       '#E34F26', 11),
  ('Tailwind',       'fa-solid fa-wind',         '#06B6D4', 12)
) as v(name, icon, color, sort_order)
where not exists (select 1 from public.skills);

-- ---------------------------------------------------------------------
-- 3. Blog gallery: several photos per post
-- ---------------------------------------------------------------------

alter table public.blog_posts add column if not exists gallery text[] not null default '{}';

-- ---------------------------------------------------------------------
-- 4. Blog comments
--    Visitors add comments only through add_comment(), which validates
--    the input and rate-limits. Only the admin can delete.
-- ---------------------------------------------------------------------

create table if not exists public.blog_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.blog_posts (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 60),
  body        text not null check (char_length(body) between 1 and 1000),
  session_id  text,                         -- rate limiting only, never shown
  created_at  timestamptz not null default now()
);
create index if not exists blog_comments_post_idx on public.blog_comments (post_id, created_at);
create index if not exists blog_comments_session_idx on public.blog_comments (session_id, created_at desc);
create index if not exists blog_comments_created_idx on public.blog_comments (created_at desc);

alter table public.blog_comments enable row level security;
drop policy if exists "Public read comments"  on public.blog_comments;
drop policy if exists "Admin delete comments" on public.blog_comments;

-- Comments are readable when their post is readable (hides comments on drafts).
create policy "Public read comments" on public.blog_comments for select to anon, authenticated
  using (exists (select 1 from public.blog_posts p where p.id = post_id));
create policy "Admin delete comments" on public.blog_comments for delete to authenticated
  using ((select public.is_admin()));

-- session_id is left out on purpose so it can't be read through the API.
revoke all on public.blog_comments from anon, authenticated;
grant select (id, post_id, author_name, body, created_at) on public.blog_comments to anon, authenticated;
grant delete on public.blog_comments to authenticated;

create or replace function public.add_comment(
  p_post_id    uuid,
  p_author     text,
  p_body       text,
  p_session_id text
)
returns table (id uuid, post_id uuid, author_name text, body text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_author text := btrim(coalesce(p_author, ''));
  clean_body   text := btrim(coalesce(p_body, ''));
begin
  if char_length(clean_author) not between 1 and 60 then
    raise exception 'Please enter a name (60 characters max).' using errcode = '22023';
  end if;
  if char_length(clean_body) not between 1 and 1000 then
    raise exception 'Comments must be 1 to 1000 characters.' using errcode = '22023';
  end if;
  if p_session_id is null or char_length(p_session_id) not between 8 and 64 then
    raise exception 'Invalid request.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.blog_posts p where p.id = p_post_id and p.published) then
    raise exception 'This post is not open for comments.' using errcode = '22023';
  end if;

  -- 5 per visitor per 10 minutes, and 30 site-wide per 10 minutes.
  if (select count(*) from public.blog_comments c
      where c.session_id = p_session_id and c.created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.blog_comments c
         where c.created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many comments. Please try again in a few minutes.' using errcode = 'P0001';
  end if;

  return query
    insert into public.blog_comments as c (post_id, author_name, body, session_id)
    values (p_post_id, clean_author, clean_body, p_session_id)
    returning c.id, c.post_id, c.author_name, c.body, c.created_at;
end;
$$;

revoke all on function public.add_comment(uuid, text, text, text) from public;
grant execute on function public.add_comment(uuid, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Realtime: a new profile picture appears for open visitors right away
-- ---------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.site_settings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
