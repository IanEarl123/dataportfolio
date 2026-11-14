-- =====================================================================
-- Engagement update: verified-email comments with admin replies and
-- reactions, post reactions and share counts, certificate sections.
-- Run once in: Supabase Dashboard -> SQL Editor (after 001-003).
-- Adds new things only. Existing posts, comments and certificates stay.
-- Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Certificate sections (AI, Data Analysis, ...), managed by the admin
-- ---------------------------------------------------------------------

create table if not exists public.cert_sections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 40),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.cert_sections;
create trigger set_updated_at before update on public.cert_sections
  for each row execute function public.set_updated_at();

alter table public.cert_sections enable row level security;
drop policy if exists "Public read"  on public.cert_sections;
drop policy if exists "Admin insert" on public.cert_sections;
drop policy if exists "Admin update" on public.cert_sections;
drop policy if exists "Admin delete" on public.cert_sections;
create policy "Public read"  on public.cert_sections for select to anon, authenticated using (true);
create policy "Admin insert" on public.cert_sections for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update" on public.cert_sections for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.cert_sections for delete to authenticated using ((select public.is_admin()));
grant select on public.cert_sections to anon, authenticated;
grant insert, update, delete on public.cert_sections to authenticated;

insert into public.cert_sections (name, sort_order)
select v.name, v.sort_order
from (values ('Data Analysis', 1), ('AI', 2), ('Engineering', 3), ('Frontend', 4), ('Security', 5)) as v(name, sort_order)
where not exists (select 1 from public.cert_sections);

-- Deleting a section keeps its certificates; they just become unsorted.
alter table public.certificates
  add column if not exists section_id uuid references public.cert_sections (id) on delete set null;

-- ---------------------------------------------------------------------
-- 2. Comments: email verification, replies, admin reactions
-- ---------------------------------------------------------------------

alter table public.blog_comments add column if not exists author_email   text;
alter table public.blog_comments add column if not exists status         text not null default 'published';
alter table public.blog_comments add column if not exists parent_id      uuid references public.blog_comments (id) on delete cascade;
alter table public.blog_comments add column if not exists is_admin       boolean not null default false;
alter table public.blog_comments add column if not exists admin_reaction text;
alter table public.blog_comments add column if not exists seen_by_admin  boolean not null default false;

do $$
begin
  alter table public.blog_comments add constraint blog_comments_status_check check (status in ('pending', 'published'));
exception when duplicate_object then null;
end $$;

-- Shown publicly instead of the address: "ia***@gmail.com".
alter table public.blog_comments add column if not exists author_email_masked text
  generated always as (
    case when author_email is null then null
         else left(split_part(author_email, '@', 1), 2) || '***@' || split_part(author_email, '@', 2) end
  ) stored;

-- Comments that existed before this update count as already seen.
update public.blog_comments set seen_by_admin = true where author_email is null and not is_admin;

create index if not exists blog_comments_parent_idx on public.blog_comments (parent_id);
create index if not exists blog_comments_email_idx on public.blog_comments (author_email, created_at desc);

-- One row per pending comment: the hashed code the visitor must enter.
create table if not exists public.comment_verifications (
  comment_id uuid primary key references public.blog_comments (id) on delete cascade,
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0
);

-- A verified visitor's browser keeps a token so they don't need a code every time.
create table if not exists public.commenter_tokens (
  token_hash   text primary key,
  email        text not null,
  name         text not null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

alter table public.comment_verifications enable row level security;
alter table public.commenter_tokens enable row level security;
revoke all on public.comment_verifications from anon, authenticated;
revoke all on public.commenter_tokens from anon, authenticated;

-- Public: only published comments, and never the raw email.
drop policy if exists "Public read comments" on public.blog_comments;
create policy "Public read comments" on public.blog_comments for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.blog_posts p where p.id = post_id));

drop policy if exists "Admin update comments" on public.blog_comments;
create policy "Admin update comments" on public.blog_comments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.blog_comments from anon, authenticated;
grant select (id, post_id, parent_id, author_name, author_email_masked, body, is_admin, admin_reaction, created_at)
  on public.blog_comments to anon, authenticated;
grant update (admin_reaction, seen_by_admin) on public.blog_comments to authenticated;
grant delete on public.blog_comments to authenticated;

-- Comments now go through the verified flow only.
drop function if exists public.add_comment(uuid, text, text, text);

-- ---- Server-only functions (called by the Vercel API with the service role key)

create or replace function public.comment_request(
  p_post_id    uuid,
  p_name       text,
  p_email      text,
  p_body       text,
  p_parent_id  uuid,
  p_code_hash  text,
  p_token_hash text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name  text := btrim(coalesce(p_name, ''));
  clean_email text := lower(btrim(coalesce(p_email, '')));
  clean_body  text := btrim(coalesce(p_body, ''));
  new_id      uuid;
  known       public.commenter_tokens%rowtype;
  row_out     json;
begin
  if char_length(clean_name) not between 1 and 60 then
    raise exception 'Please enter your name (60 characters max).' using errcode = '22023';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' or char_length(clean_email) > 254 then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(clean_body) not between 1 and 1000 then
    raise exception 'Comments must be 1 to 1000 characters.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.blog_posts p where p.id = p_post_id and p.published) then
    raise exception 'This post is not open for comments.' using errcode = '22023';
  end if;
  if p_parent_id is not null and not exists (
    select 1 from public.blog_comments c where c.id = p_parent_id and c.post_id = p_post_id and c.status = 'published'
  ) then
    raise exception 'The comment you are replying to no longer exists.' using errcode = '22023';
  end if;

  -- Limits: 5 comments per email per 10 minutes; 40 site-wide per 10 minutes.
  if (select count(*) from public.blog_comments c
      where c.author_email = clean_email and c.created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.blog_comments c
         where c.created_at > now() - interval '10 minutes' and not c.is_admin) >= 40 then
    raise exception 'Too many comments. Please try again in a few minutes.' using errcode = 'P0001';
  end if;

  -- Already verified in this browser: publish straight away.
  if p_token_hash is not null then
    select * into known from public.commenter_tokens t where t.token_hash = p_token_hash and t.email = clean_email;
    if found then
      update public.commenter_tokens set last_used_at = now(), name = clean_name where token_hash = p_token_hash;
      insert into public.blog_comments (post_id, parent_id, author_name, author_email, body, status)
      values (p_post_id, p_parent_id, clean_name, clean_email, clean_body, 'published')
      returning id into new_id;
      select row_to_json(x) into row_out from (
        select c.id, c.post_id, c.parent_id, c.author_name, c.author_email_masked, c.body, c.is_admin, c.admin_reaction, c.created_at
        from public.blog_comments c where c.id = new_id
      ) x;
      return json_build_object('status', 'published', 'comment', row_out);
    end if;
  end if;

  -- Otherwise hold it until the emailed code is entered (codes last 15 minutes).
  insert into public.blog_comments (post_id, parent_id, author_name, author_email, body, status)
  values (p_post_id, p_parent_id, clean_name, clean_email, clean_body, 'pending')
  returning id into new_id;
  insert into public.comment_verifications (comment_id, code_hash, expires_at)
  values (new_id, p_code_hash, now() + interval '15 minutes');

  return json_build_object('status', 'verify', 'comment_id', new_id);
end;
$$;

create or replace function public.comment_verify(
  p_comment_id uuid,
  p_code_hash  text,
  p_token_hash text
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v   public.comment_verifications%rowtype;
  c   public.blog_comments%rowtype;
  row_out json;
begin
  -- Failures return a status instead of raising: raising would roll back
  -- the attempt counter and the cleanup, which must stick.
  select * into v from public.comment_verifications where comment_id = p_comment_id;
  if not found then
    return json_build_object('status', 'error',
      'message', 'This code has already been used or has expired. Please post your comment again.');
  end if;
  if v.expires_at < now() or v.attempts >= 5 then
    delete from public.blog_comments where id = p_comment_id and status = 'pending';
    return json_build_object('status', 'error',
      'message', 'This code has expired or had too many wrong tries. Please post your comment again.');
  end if;
  if v.code_hash <> p_code_hash then
    update public.comment_verifications set attempts = attempts + 1 where comment_id = p_comment_id;
    return json_build_object('status', 'error',
      'message', 'That code is not right. Check the email and try again.', 'attempts_left', 4 - v.attempts);
  end if;

  update public.blog_comments set status = 'published', created_at = now() where id = p_comment_id returning * into c;
  delete from public.comment_verifications where comment_id = p_comment_id;
  insert into public.commenter_tokens (token_hash, email, name) values (p_token_hash, c.author_email, c.author_name)
  on conflict (token_hash) do nothing;

  select row_to_json(x) into row_out from (
    select b.id, b.post_id, b.parent_id, b.author_name, b.author_email_masked, b.body, b.is_admin, b.admin_reaction, b.created_at
    from public.blog_comments b where b.id = p_comment_id
  ) x;
  return json_build_object('status', 'published', 'comment', row_out);
end;
$$;

-- Details for the "new comment" email sent to the admin.
create or replace function public.comment_notice(p_comment_id uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'author_name', c.author_name, 'author_email', c.author_email, 'body', c.body,
    'post_title', p.title, 'post_slug', p.slug, 'is_reply', c.parent_id is not null
  )
  from public.blog_comments c join public.blog_posts p on p.id = c.post_id
  where c.id = p_comment_id;
$$;

revoke all on function public.comment_request(uuid, text, text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.comment_verify(uuid, text, text) from public, anon, authenticated;
revoke all on function public.comment_notice(uuid) from public, anon, authenticated;
grant execute on function public.comment_request(uuid, text, text, text, uuid, text, text) to service_role;
grant execute on function public.comment_verify(uuid, text, text) to service_role;
grant execute on function public.comment_notice(uuid) to service_role;

-- ---- Admin-only functions (called from the dashboard while signed in)

-- Every published comment with the commenter's full email.
create or replace function public.admin_comments()
returns table (
  id uuid, post_id uuid, parent_id uuid, author_name text, author_email text, body text,
  is_admin boolean, admin_reaction text, seen_by_admin boolean, created_at timestamptz,
  post_title text, post_slug text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select c.id, c.post_id, c.parent_id, c.author_name, c.author_email, c.body, c.is_admin,
           c.admin_reaction, c.seen_by_admin, c.created_at, p.title, p.slug
    from public.blog_comments c join public.blog_posts p on p.id = c.post_id
    where c.status = 'published'
    order by c.created_at desc;
end;
$$;

create or replace function public.admin_reply(p_parent_id uuid, p_body text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.blog_comments%rowtype;
  clean  text := btrim(coalesce(p_body, ''));
  new_id uuid;
  row_out json;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if char_length(clean) not between 1 and 1000 then
    raise exception 'Replies must be 1 to 1000 characters.' using errcode = '22023';
  end if;
  select * into parent from public.blog_comments where id = p_parent_id and status = 'published';
  if not found then
    raise exception 'That comment no longer exists.' using errcode = '22023';
  end if;

  insert into public.blog_comments (post_id, parent_id, author_name, body, status, is_admin, seen_by_admin)
  values (parent.post_id, parent.id, 'Ian Earl Besañez', clean, 'published', true, true)
  returning id into new_id;
  update public.blog_comments set seen_by_admin = true where id = parent.id;

  select row_to_json(x) into row_out from (
    select c.id, c.post_id, c.parent_id, c.author_name, c.author_email_masked, c.body, c.is_admin, c.admin_reaction, c.created_at
    from public.blog_comments c where c.id = new_id
  ) x;
  return row_out;
end;
$$;

revoke all on function public.admin_comments() from public, anon;
revoke all on function public.admin_reply(uuid, text) from public, anon;
grant execute on function public.admin_comments() to authenticated;
grant execute on function public.admin_reply(uuid, text) to authenticated;

-- Pending comments that were never verified are removed after a day.
create or replace function public.purge_stale_pending()
returns void language sql security definer set search_path = '' as $$
  delete from public.blog_comments where status = 'pending' and created_at < now() - interval '1 day';
$$;
revoke all on function public.purge_stale_pending() from public, anon, authenticated;
grant execute on function public.purge_stale_pending() to service_role;

-- ---------------------------------------------------------------------
-- 3. Post reactions and shares
-- ---------------------------------------------------------------------

create table if not exists public.post_reactions (
  post_id    uuid not null references public.blog_posts (id) on delete cascade,
  session_id text not null,
  kind       text not null check (kind in ('like', 'love', 'insightful', 'celebrate')),
  created_at timestamptz not null default now(),
  primary key (post_id, session_id)
);

create table if not exists public.post_shares (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.blog_posts (id) on delete cascade,
  platform   text not null check (platform in ('linkedin', 'facebook', 'tiktok', 'copy', 'native')),
  session_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_shares_post_idx on public.post_shares (post_id);

alter table public.post_reactions enable row level security;
alter table public.post_shares enable row level security;
revoke all on public.post_reactions from anon, authenticated;
revoke all on public.post_shares from anon, authenticated;

-- Counts for a set of posts, plus this visitor's own reaction.
create or replace function public.post_engagement(p_post_ids uuid[], p_session_id text)
returns table (post_id uuid, reactions json, total_reactions bigint, comments bigint, shares bigint, my_reaction text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
    coalesce((select json_object_agg(r.kind, r.n) from (
      select pr.kind, count(*) n from public.post_reactions pr where pr.post_id = p.id group by pr.kind) r), '{}'::json),
    (select count(*) from public.post_reactions pr where pr.post_id = p.id),
    (select count(*) from public.blog_comments c where c.post_id = p.id and c.status = 'published'),
    (select count(*) from public.post_shares s where s.post_id = p.id),
    (select pr.kind from public.post_reactions pr where pr.post_id = p.id and pr.session_id = p_session_id)
  from public.blog_posts p
  where p.id = any (p_post_ids) and p.published;
$$;

-- Set, change or (with p_kind = null) remove this visitor's reaction.
create or replace function public.react_to_post(p_post_id uuid, p_session_id text, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or char_length(p_session_id) not between 8 and 64 then
    raise exception 'Invalid request.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.blog_posts p where p.id = p_post_id and p.published) then
    raise exception 'Post not found.' using errcode = '22023';
  end if;
  if p_kind is null then
    delete from public.post_reactions where post_id = p_post_id and session_id = p_session_id;
  else
    insert into public.post_reactions (post_id, session_id, kind) values (p_post_id, p_session_id, p_kind)
    on conflict (post_id, session_id) do update set kind = excluded.kind, created_at = now();
  end if;
end;
$$;

-- Counted at most once per visitor, platform and post per day.
create or replace function public.record_share(p_post_id uuid, p_session_id text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or char_length(p_session_id) not between 8 and 64 then
    raise exception 'Invalid request.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.blog_posts p where p.id = p_post_id and p.published) then
    return;
  end if;
  if exists (select 1 from public.post_shares s where s.post_id = p_post_id and s.session_id = p_session_id
             and s.platform = p_platform and s.created_at > now() - interval '1 day') then
    return;
  end if;
  insert into public.post_shares (post_id, platform, session_id) values (p_post_id, p_platform, p_session_id);
end;
$$;

revoke all on function public.post_engagement(uuid[], text) from public;
revoke all on function public.react_to_post(uuid, text, text) from public;
revoke all on function public.record_share(uuid, text, text) from public;
grant execute on function public.post_engagement(uuid[], text) to anon, authenticated;
grant execute on function public.react_to_post(uuid, text, text) to anon, authenticated;
grant execute on function public.record_share(uuid, text, text) to anon, authenticated;
