create table if not exists public.club_serkan_state (
  client_id text not null,
  storage_key text not null,
  value jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (client_id, storage_key)
);

alter table public.club_serkan_state enable row level security;

drop policy if exists "Allow public prototype read" on public.club_serkan_state;
drop policy if exists "Allow public prototype insert" on public.club_serkan_state;
drop policy if exists "Allow public prototype update" on public.club_serkan_state;
drop policy if exists "Allow public prototype delete" on public.club_serkan_state;

create policy "Allow public prototype read"
on public.club_serkan_state
for select
to anon
using (true);

create policy "Allow public prototype insert"
on public.club_serkan_state
for insert
to anon
with check (true);

create policy "Allow public prototype update"
on public.club_serkan_state
for update
to anon
using (true)
with check (true);

create policy "Allow public prototype delete"
on public.club_serkan_state
for delete
to anon
using (true);

alter publication supabase_realtime add table public.club_serkan_state;
