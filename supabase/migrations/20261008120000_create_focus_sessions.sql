-- Recreates public.focus_sessions. The extension's background sync reads
-- url, start_time and target_duration for the signed-in user's active
-- sessions (extension/background/background.js), so a missing table makes the
-- whole blocked_sites + focus_sessions sync fail.
create table if not exists public.focus_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  -- Minutes, matching FocusSession.target_duration in useFocusSessions.ts.
  target_duration integer not null check (target_duration > 0),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- The extension filters on user_id and status=active.
create index if not exists focus_sessions_user_status_idx
  on public.focus_sessions (user_id, status);

alter table public.focus_sessions enable row level security;

grant select, insert, update, delete on public.focus_sessions to authenticated;

-- Same shape as blocked_sites_own_all: users only touch their own rows.
drop policy if exists focus_sessions_own_all on public.focus_sessions;
create policy focus_sessions_own_all
  on public.focus_sessions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
