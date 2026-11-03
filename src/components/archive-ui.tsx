import { Link } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";
import { useId, type ReactNode } from "react";
import type { Item } from "@/lib/items";
import { useArchive } from "@/lib/archive-context";

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-xl font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function HeartButton({ item }: { item: Item }) {
  const { toggleFavorite } = useArchive();
  return (
    <button
      aria-label={item.favorite ? "Remover dos favoritos" : "Favoritar"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item.id);
      }}
      className="press -m-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-base leading-none"
    >
      <span className={item.favorite ? "text-primary" : "text-muted-foreground"}>
        {item.favorite ? "♥" : "♡"}
      </span>
    </button>
  );
}

export function EmptyDrawer({
  text,
  kaomoji,
  action,
}: {
  text: string;
  kaomoji?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-row flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="text-2xl text-muted-foreground">{kaomoji || "( ˘ω˘ )"}</div>
      <p className="text-base">{text}</p>
      {action ?? (
        <Link to="/add" className="press btn-primary">
          Adicionar
        </Link>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-2xl border border-border bg-paper px-3 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-primary";

// Placeholder rows while the archive loads from storage, so the empty state doesn't flash.
export function ItemCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="carregando">
      {Array.from({ length: count }, (_, n) => (
        <div key={n} className="surface-row flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded bg-muted" />
          <div className="grid flex-1 gap-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// "Quem vê": shared with both (default) or only me. Privacy is enforced by the database.
export function VisibilityPicker({
  onlyMe,
  onChange,
}: {
  onlyMe: boolean;
  onChange: (onlyMe: boolean) => void;
}) {
  const labelId = useId();
  const options = [
    { value: false, label: "Nós dois", Icon: Users },
    { value: true, label: "Só eu", Icon: Lock },
  ];
  return (
    <div className="grid gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        Quem vê
      </span>
      <div role="group" aria-labelledby={labelId} className="flex gap-1.5">
        {options.map(({ value, label, Icon }) => (
          <button
            key={label}
            type="button"
            aria-pressed={onlyMe === value}
            onClick={() => onChange(value)}
            className={`press chip min-h-11 inline-flex items-center gap-1.5 ${
              onlyMe === value ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
