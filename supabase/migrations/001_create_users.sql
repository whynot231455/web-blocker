-- 001_create_users.sql
-- Note: Supabase handles users in 'auth.users'. This table is for additional user profile data.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  email text unique not null,

  constraint email_length check (char_length(email) >= 3)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- 🔒 Only allow users to view their own profile
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

-- 🔒 Only allow users to insert their own profile
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- 🔒 Only allow users to update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

-- 🔒 Optional: Allow users to delete their own profile
create policy "Users can delete their own profile"
on public.profiles
for delete
using (auth.uid() = id);