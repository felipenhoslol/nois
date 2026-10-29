import { Music, Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player-context";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, openTurntable, progress } = usePlayer();
  if (!currentTrack) return null;

  return (
    <aside
      aria-label="Música tocando"
      className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] pointer-events-none z-40 mx-auto w-full max-w-[640px] px-5 md:bottom-6"
    >
      <div className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-lg">
        <button
          onClick={openTurntable}
          aria-label={`Abrir player: ${currentTrack.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
            {currentTrack.image ? (
              <img src={currentTrack.image} alt="" className="size-full object-cover" />
            ) : (
              <Music size={20} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-medium">{currentTrack.title}</span>
            {currentTrack.subtitle && (
              <span className="block truncate text-sm text-muted-foreground">
                {currentTrack.subtitle}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="press grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-0.5 bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </aside>
  );
}
