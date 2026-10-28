import { Music, Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import { useArchive } from "@/lib/archive-context";

// Compact card at the top of /c/music; the one big player stays the overlay (no second iframe).
export function NowPlaying() {
  const { items } = useArchive();
  const { currentTrack, isPlaying, playTrack, togglePlay, openTurntable } = usePlayer();
  const track =
    currentTrack ??
    items
      .filter((i) => i.category === "music")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!track) return null;
  const isCurrent = currentTrack?.id === track.id;
  const playing = isCurrent && isPlaying;

  return (
    <section aria-label="Tocando agora" className="mb-6">
      <p className="mb-2 text-sm text-muted-foreground">
        {currentTrack ? "Tocando agora" : "Para começar"}
      </p>
      <div className="surface-row flex items-center gap-3">
        <button
          onClick={() => {
            if (!isCurrent) playTrack(track);
            openTurntable();
          }}
          aria-label={`Abrir player: ${track.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
            {track.image ? (
              <img src={track.image} alt="" className="size-full object-cover" />
            ) : (
              <Music size={22} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-medium">{track.title}</span>
            {track.subtitle && (
              <span className="block truncate text-sm text-muted-foreground">{track.subtitle}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => (isCurrent ? togglePlay() : playTrack(track))}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
      </div>
    </section>
  );
}
