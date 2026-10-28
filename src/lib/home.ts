import { CATEGORIES, catMeta, type CategoryMeta } from "./categories";
import type { Item } from "./items";

/** Drawers with items first (most items first, ties in CATEGORIES order); empty archive gets a starter set. */
export function pickHomeDrawers(items: Item[], max = 6): CategoryMeta[] {
  const used = CATEGORIES.map((c) => ({ c, n: items.filter((i) => i.category === c.key).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n); // stable sort keeps CATEGORIES order on ties
  if (!used.length) return (["music", "gift", "memory"] as const).map(catMeta);
  return used.slice(0, max).map((x) => x.c);
}
