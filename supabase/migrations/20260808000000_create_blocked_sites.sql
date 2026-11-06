-- Records the public.blocked_sites table as it exists in the live ctrl-blck
-- project, so the schema can be rebuilt from the repo. Idempotent: running it
-- against a database that already has the table changes nothing.
create table if not exists public.blocked_sites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Optional saved block window (days and times when the site stays unlocked).
  access_window jsonb,
  -- One row per site per user; also serves lookups by (user_id, url).
  constraint blocked_sites_user_id_url_key unique (user_id, url)
);

alter table public.blocked_sites enable row level security;

grant select, insert, update, delete on public.blocked_sites to authenticated;

-- Users only touch their own rows.
drop policy if exists blocked_sites_own_all on public.blocked_sites;
create policy blocked_sites_own_all
  on public.blocked_sites
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
