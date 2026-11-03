-- "Só eu" items: each item has an owner; private items are visible only to their owner.

-- Owner = whoever created it. The database sets it; the app never sends it.
alter table public.items
  add column owner_id uuid default auth.uid() references auth.users on delete set null,
  add column private boolean not null default false;

-- Existing items: the last person who saved them becomes the owner; all stay shared.
update public.items set owner_id = user_id where owner_id is null;

drop policy "members share items" on public.items;

-- Read/update/delete: members see shared items, and their own private ones.
create policy "members see shared and own private items" on public.items for all to authenticated
  using (public.is_member() and (not private or owner_id = auth.uid()))
  with check (
    public.is_member()
    and user_id = auth.uid()
    -- only the owner can make an item private (or keep editing it while private)
    and (not private or owner_id = auth.uid())
  );

-- The owner is always whoever created the item, and it never changes afterwards.
create function public.keep_item_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
  else
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;
create trigger keep_item_owner before insert or update on public.items
  for each row execute function public.keep_item_owner();

-- Media: each person can list/remove only their own folder, so the partner can't browse
-- the photos/audio of "Só eu" items. Shared items still show their photos: <img src>
-- uses the public URL stored in the item, which needs no listing permission.
drop policy "members read media" on storage.objects;
drop policy "members delete media" on storage.objects;
create policy "members read own media" on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "members delete own media" on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
