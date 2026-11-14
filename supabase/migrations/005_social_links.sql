-- =====================================================================
-- Social links shown in the sidebar, managed from Admin -> Social Links.
-- Run once in: Supabase Dashboard -> SQL Editor (after 001-004).
-- Adds new things only. Safe to re-run.
-- =====================================================================

create table if not exists public.social_links (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  icon       text not null default 'fa-solid fa-link',
  -- Only real web or email links, so a link can never run code in the browser.
  url        text not null check (url ~* '^(https?://|mailto:)'),
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.social_links;
create trigger set_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

alter table public.social_links enable row level security;
drop policy if exists "Public read"  on public.social_links;
drop policy if exists "Admin insert" on public.social_links;
drop policy if exists "Admin update" on public.social_links;
drop policy if exists "Admin delete" on public.social_links;
-- Visitors see visible links; the admin also sees hidden ones.
create policy "Public read"  on public.social_links for select to anon, authenticated
  using (is_visible or (select public.is_admin()));
create policy "Admin insert" on public.social_links for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update" on public.social_links for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.social_links for delete to authenticated using ((select public.is_admin()));
grant select on public.social_links to anon, authenticated;
grant insert, update, delete on public.social_links to authenticated;

-- The accounts the sidebar already shows, added only when the table is empty.
insert into public.social_links (name, icon, url, sort_order)
select v.name, v.icon, v.url, v.sort_order
from (values
  ('GitHub',    'fa-brands fa-github',      'https://github.com/IanEarl123', 1),
  ('LinkedIn',  'fa-brands fa-linkedin-in', 'https://www.linkedin.com/in/ian-earl-besa%C3%B1ez-6a1886288/', 2),
  ('Facebook',  'fa-brands fa-facebook-f',  'https://web.facebook.com/ianearl.besanez', 3),
  ('Instagram', 'fa-brands fa-instagram',   'https://www.instagram.com/silentchinitoprince/', 4)
) as v(name, icon, url, sort_order)
where not exists (select 1 from public.social_links);
