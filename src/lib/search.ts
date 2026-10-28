import type { Item } from "./items";

// Free-text match over the fields people remember an item by. "#tag" works like "tag".
export function matchesQuery(item: Item, q: string): boolean {
  const needle = q.trim().toLowerCase().replace(/^#/, "");
  if (!needle) return true;
  return [item.title, item.subtitle, item.notes, item.reason, item.status, item.place, ...item.tags]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
