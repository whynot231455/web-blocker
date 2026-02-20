-- 002_create_blocked_sites.sql
create table public.blocked_sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true not null
);

-- Enable RLS
alter table public.blocked_sites enable row level security;

-- Policies
create policy "Users can view their own blocked sites." on public.blocked_sites
  for select using (auth.uid() = user_id);

create policy "Users can insert their own blocked sites." on public.blocked_sites
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own blocked sites." on public.blocked_sites
  for update using (auth.uid() = user_id);

create policy "Users can delete their own blocked sites." on public.blocked_sites
  for delete using (auth.uid() = user_id);
