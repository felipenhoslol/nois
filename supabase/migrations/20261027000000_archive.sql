-- Archive: one row per item (whole item as jsonb) + one settings row per user.
create table public.items (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;
alter table public.settings enable row level security;

create policy "own items" on public.items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own settings" on public.settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public bucket so <img src> works directly; paths are <user_id>/<random>.<ext>.
-- 10 MB cap and images/audio only, so the bucket can't become free file hosting.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/*', 'audio/*']);

create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
