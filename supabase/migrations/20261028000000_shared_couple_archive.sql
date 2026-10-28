-- One archive shared by the couple. Only the e-mails in public.members can read or write it.

-- Who is in the archive. No policies on purpose: nobody can read or change this list from the app.
create table public.members (email text primary key check (email = lower(email)));
alter table public.members enable row level security;

create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members where email = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- Items: one shared set keyed by id. user_id now means "who saved it last".
drop policy "own items" on public.items;
-- Both accounts may hold the same id (e.g. the seed-* examples): keep the newest copy.
delete from public.items a
  using public.items b
  where a.id = b.id and (a.updated_at, a.user_id::text) < (b.updated_at, b.user_id::text);
alter table public.items drop constraint items_pkey;
alter table public.items add primary key (id);
alter table public.items alter column user_id drop not null;
alter table public.items drop constraint items_user_id_fkey;
alter table public.items add constraint items_user_id_fkey
  foreign key (user_id) references auth.users on delete set null;
create policy "members share items" on public.items for all to authenticated
  using (public.is_member())
  with check (public.is_member() and user_id = auth.uid());

-- Settings: a single shared row, seeded from the most recently saved per-user settings.
create table public.settings_shared (
  id text primary key default 'shared' check (id = 'shared'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.settings_shared (id, data, updated_at)
  select 'shared', data, updated_at from public.settings order by updated_at desc limit 1;
drop table public.settings;
alter table public.settings_shared rename to settings;
alter table public.settings enable row level security;
create policy "members share settings" on public.settings for all to authenticated
  using (public.is_member())
  with check (public.is_member());

-- Photos/audio: members upload into their own folder; either can delete.
drop policy "upload own folder" on storage.objects;
drop policy "delete own folder" on storage.objects;
create policy "members upload media" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "members delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_member());
-- Storage needs select to remove files; only members get it (the bucket is still not listable by others).
create policy "members read media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_member());

-- After running this, add the two of you (lowercase e-mails):
--   insert into public.members (email) values ('voce@exemplo.com'), ('ela@exemplo.com');
