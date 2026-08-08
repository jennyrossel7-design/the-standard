-- The Standard — Supabase schema, Phase 2
-- Run once in the Supabase SQL Editor after creating the project.
-- Every table is protected by row-level security tied to the signed-in user:
-- your rows are readable and writable by your account only.

-- One uniform shape: each record is a JSON document keyed by (user, entity, id),
-- with updated_at for last-write-wins sync. This mirrors the app's local store
-- exactly and keeps migrations in the app layer.

create table if not exists public.records (
  user_id uuid not null references auth.users (id) on delete cascade,
  entity text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  primary key (user_id, entity, id)
);

create index if not exists records_user_entity_updated
  on public.records (user_id, entity, updated_at);

alter table public.records enable row level security;

create policy "own rows: select" on public.records
  for select using (auth.uid() = user_id);
create policy "own rows: insert" on public.records
  for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.records
  for delete using (auth.uid() = user_id);

-- Vision-board images live in a private storage bucket, path-scoped per user.
insert into storage.buckets (id, name, public)
values ('vision', 'vision', false)
on conflict (id) do nothing;

create policy "own images: read" on storage.objects
  for select using (
    bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own images: write" on storage.objects
  for insert with check (
    bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own images: update" on storage.objects
  for update using (
    bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own images: delete" on storage.objects
  for delete using (
    bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text
  );
