-- 003_create_sessions.sql
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')) not null,
  goal text,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Policies
create policy "Users can view their own sessions." on public.sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions." on public.sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions." on public.sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own sessions." on public.sessions
  for delete using (auth.uid() = user_id);
