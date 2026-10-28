import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { catMeta, type Item } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { usePlayer } from "@/lib/player-context";

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="label-chip">{children}</span>;
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
      className="press shrink-0 rounded-full px-1.5 py-1 text-base leading-none"
    >
      <span className={item.favorite ? "text-primary" : "text-muted-foreground"}>
        {item.favorite ? "♥" : "♡"}
      </span>
    </button>
  );
}

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  const meta = catMeta(item.category);
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isThisPlaying = isPlaying && currentTrack?.id === item.id;

  return (
    <Link
      to="/item/$id"
      params={{ id: item.id }}
      className="card-object anim-in block p-3 group"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail: photo/GIF, spinning vinyl on play, or category kaomoji */}
        {item.image ? (
          <div
            className={`size-11 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-secondary shadow-sm transition-all ${
              isThisPlaying ? "rounded-full ring-2 ring-primary animate-[spin-disc_3s_linear_infinite]" : ""
            }`}
          >
            <img src={item.image} alt={item.title} className="size-full object-cover" />
          </div>
        ) : (
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-border bg-secondary text-sm font-mono relative transition-all ${
              isThisPlaying ? "rounded-full border-primary ring-2 ring-primary/30 animate-[spin-disc_3s_linear_infinite] bg-neutral-900 text-primary-foreground" : ""
            }`}
          >
            {item.category === "music" && isThisPlaying ? (
              <span>♬</span>
            ) : (
              <span className="text-base">{meta.emoji}</span>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1">
            <p className="truncate font-medium leading-tight">{item.title}</p>
          </div>

          {item.subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Chip>{meta.label}</Chip>
            <span className="font-mono text-[0.6rem] text-muted-foreground/80 select-none">
              {meta.kaomoji}
            </span>
            {item.status ? <Chip>{item.status}</Chip> : null}
            {item.tags.slice(0, 2).map((t) => (
              <span key={t} className="font-hand text-sm text-accent-foreground/80">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Quick action buttons on right side */}
        <div className="flex items-center gap-1 shrink-0">
          {item.category === "music" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playTrack(item);
              }}
              title={isThisPlaying ? "Tocando agora no toca-discos" : "Tocar no toca-discos"}
              className={`press size-7 rounded-full flex items-center justify-center font-mono text-xs cursor-pointer ${
                isThisPlaying
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-secondary hover:bg-primary/20 text-foreground"
              }`}
            >
              {isThisPlaying ? "❚❚" : "▶"}
            </button>
          )}
          <HeartButton item={item} />
        </div>
      </div>
    </Link>
  );
}

export function EmptyDrawer({ text, kaomoji }: { text: string; kaomoji?: string }) {
  return (
    <div className="card-object flex flex-col items-center gap-2 px-6 py-10 text-center bg-secondary/40">
      <div className="text-2xl font-mono text-muted-foreground">
        {kaomoji || "( ˘ω˘ ) ✦"}
      </div>
      <p className="font-hand text-xl text-foreground">{text}</p>
      <p className="max-w-[16rem] text-xs text-muted-foreground">
        Toque em “+” para guardar a primeira coisa nesta gaveta.
      </p>
    </div>
  );
}


export function RetroClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="h-[3.1rem]" />;
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return (
    <div className="rounded-[var(--radius-sm)] border border-border bg-secondary px-3 py-1.5 text-right">
      <p className="font-mono text-xl leading-none tabular-nums">{time}</p>
      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
        {date}
      </p>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-border bg-paper px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary";
