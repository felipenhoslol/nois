import { Link } from "@tanstack/react-router";
import { catMeta } from "@/lib/categories";
import type { Item } from "@/lib/items";
import { HeartButton } from "@/components/archive-ui";

export function ItemRow({ item }: { item: Item }) {
  const meta = catMeta(item.category);
  return (
    <Link
      to="/item/$id"
      params={{ id: item.id }}
      className="surface-row press flex items-center gap-3"
    >
      {item.image ? (
        <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">
          {meta.emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-medium">{item.title}</span>
        {item.subtitle ? (
          <span className="block truncate text-sm text-muted-foreground">{item.subtitle}</span>
        ) : null}
        <span className="mt-1 inline-block rounded-full border border-border px-2 text-[13px]">
          {meta.label}
        </span>
      </span>
      <HeartButton item={item} />
    </Link>
  );
}
