import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { catMeta } from "@/lib/categories";
import type { Item } from "@/lib/items";
import { usePlayer } from "@/lib/player-context";
import { HeartButton } from "@/components/archive-ui";

function PlayButton({ item }: { item: Item }) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = usePlayer();
  const current = currentTrack?.id === item.id;
  const playing = current && isPlaying;
  return (
    <button
      aria-label={playing ? "Pausar" : `Tocar ${item.title}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (current) togglePlay();
        else playTrack(item);
      }}
      className="press -my-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
    >
      {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
    </button>
  );
}

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
        <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[13px]">
          {meta.label}
        </span>
      </span>
      {item.category === "music" && (item.audioUrl || item.link) ? (
        <PlayButton item={item} />
      ) : null}
      <HeartButton item={item} />
    </Link>
  );
}
