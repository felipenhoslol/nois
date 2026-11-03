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
