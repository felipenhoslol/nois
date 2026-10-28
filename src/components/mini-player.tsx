import { usePlayer } from "@/lib/player-context";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, openTurntable, progress } = usePlayer();

  if (!currentTrack) return null;

  return (
    <aside
      aria-label="Mini-player toca-discos"
      className="fixed bottom-20 right-3 z-40 max-w-[calc(100vw-1.5rem)] w-80 md:bottom-6 md:right-6"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/90 bg-card/95 p-2.5 shadow-2xl backdrop-blur-md relative overflow-hidden transition-transform">
        {/* Track progress line on bottom edge */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        {/* Mini Spinning Vinyl Disc Thumbnail */}
        <button
          onClick={openTurntable}
          className="relative size-11 shrink-0 rounded-full border-2 border-border/80 bg-neutral-950 shadow-md flex items-center justify-center cursor-pointer p-0.5"
          aria-label="Abrir toca-discos completo"
          title="Clique para abrir o toca-discos completo"
        >
          {/* Concentric grooved disc that spins */}
          <div
            className="size-full rounded-full flex items-center justify-center overflow-hidden transition-transform"
            style={{
              animation: isPlaying ? "spin-disc 2s linear infinite" : "none",
              backgroundImage:
                "repeating-radial-gradient(circle, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 2px, transparent 3px)",
            }}
          >
            {/* Center Label: Item Cover photo / GIF if available, otherwise note icon */}
            {currentTrack.image ? (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="size-6 rounded-full object-cover shadow"
              />
            ) : (
              <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[0.65rem] text-primary-foreground font-bold">
                ♬
              </div>
            )}
            {/* Spindle hole */}
            <div className="absolute size-1.5 rounded-full bg-zinc-300 border border-black/50" />
          </div>
        </button>

        {/* Title, Subtitle, and expand button */}
        <button
          onClick={openTurntable}
          className="min-w-0 flex-1 text-left cursor-pointer group"
          aria-label="Ver detalhes no toca-discos"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                isPlaying ? "bg-emerald-500 animate-pulse" : "bg-neutral-500"
              }`}
            />
            <p className="truncate text-xs font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
              {currentTrack.title}
            </p>
          </div>
          <p className="mt-0.5 truncate font-mono text-[0.62rem] text-muted-foreground">
            {currentTrack.subtitle || "Tocando no toca-discos"}
          </p>
        </button>

        {/* Play / Pause button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="press size-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-mono font-bold shadow-md cursor-pointer hover:brightness-110"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>
      </div>
    </aside>
  );
}
