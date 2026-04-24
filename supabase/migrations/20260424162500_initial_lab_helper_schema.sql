create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  github_username text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'ta', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_id text not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  ai_vendor text,
  ai_model text,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_id text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lab_id)
);

create index if not exists chat_sessions_user_lab_idx on public.chat_sessions(user_id, lab_id, updated_at desc);
create index if not exists chat_messages_session_idx on public.chat_messages(session_id, created_at);
create index if not exists lab_notes_user_lab_idx on public.lab_notes(user_id, lab_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

drop trigger if exists lab_notes_set_updated_at on public.lab_notes;
create trigger lab_notes_set_updated_at
before update on public.lab_notes
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.lab_notes enable row level security;

drop policy if exists "profiles are readable by signed in users" on public.profiles;
create policy "profiles are readable by signed in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users can insert their profile" on public.profiles;
create policy "users can insert their profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users can update their profile" on public.profiles;
create policy "users can update their profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "users can read their chat sessions" on public.chat_sessions;
create policy "users can read their chat sessions"
on public.chat_sessions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can create their chat sessions" on public.chat_sessions;
create policy "users can create their chat sessions"
on public.chat_sessions for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update their chat sessions" on public.chat_sessions;
create policy "users can update their chat sessions"
on public.chat_sessions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can delete their chat sessions" on public.chat_sessions;
create policy "users can delete their chat sessions"
on public.chat_sessions for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can read messages in their sessions" on public.chat_messages;
create policy "users can read messages in their sessions"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_sessions
    where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
  )
);

drop policy if exists "users can insert messages in their sessions" on public.chat_messages;
create policy "users can insert messages in their sessions"
on public.chat_messages for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_sessions
    where chat_sessions.id = chat_messages.session_id
      and chat_sessions.user_id = auth.uid()
  )
);

drop policy if exists "users can read their lab notes" on public.lab_notes;
create policy "users can read their lab notes"
on public.lab_notes for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can upsert their lab notes" on public.lab_notes;
create policy "users can upsert their lab notes"
on public.lab_notes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update their lab notes" on public.lab_notes;
create policy "users can update their lab notes"
on public.lab_notes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lab-message-images',
  'lab-message-images',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users can read their lab image objects" on storage.objects;
create policy "users can read their lab image objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'lab-message-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "users can upload their lab image objects" on storage.objects;
create policy "users can upload their lab image objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'lab-message-images'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "users can delete their lab image objects" on storage.objects;
create policy "users can delete their lab image objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'lab-message-images'
  and split_part(name, '/', 1) = auth.uid()::text
);
