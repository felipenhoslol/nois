import { useEffect, useRef, type KeyboardEvent } from "react";
import { Music, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import { useArchive } from "@/lib/archive-context";

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  return `${Math.floor(secs / 60)}:${Math.floor(secs % 60)
    .toString()
    .padStart(2, "0")}`;
};

export function Player({ onClose }: { onClose: () => void }) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    rpm,
    volume,
    source,
    togglePlay,
    seek,
    setRpm,
    setVolume,
    playNext,
    playPrev,
  } = usePlayer();
  const { device } = useArchive();
  const spinning = isPlaying && device.animations;
  const spotify = source === "spotify";
  const slotRef = useRef<HTMLDivElement>(null);

  // The Spotify iframe lives in a container that is never moved (moving reloads it):
  // we lay it over the slot reserved here instead.
  useEffect(() => {
    const box = document.getElementById("archive-spotify-player-container");
    const slot = slotRef.current;
    if (!spotify || !box || !slot) return;
    const place = () => {
      const r = slot.getBoundingClientRect();
      box.style.setProperty("--slot-top", `${r.top}px`);
      box.style.setProperty("--slot-left", `${r.left}px`);
      box.style.setProperty("--slot-w", `${r.width}px`);
    };
    place();
    box.setAttribute("data-visible", "true");
    box.setAttribute("aria-hidden", "false");
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      box.setAttribute("data-visible", "false");
      box.setAttribute("aria-hidden", "true");
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [spotify]);

  // Modal focus: move in on open, give back to the opener on close.
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    rootRef.current?.querySelector("button")?.focus();
    return () => opener?.focus();
  }, []);

  // On the player's own DOM, so an overlay on top (Ctrl+K) keeps its Escape. The Spotify
  // iframe sits outside this DOM (never reparented), so it is not in the Tab cycle.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !rootRef.current) return;
    const f = rootRef.current.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled)",
    );
    const first = f[0];
    const last = f[f.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === rootRef.current)
    ) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  const cover = currentTrack?.image;

  return (
    <section
      ref={rootRef}
      onKeyDown={onKeyDown}
      // Clicks on the cover/title focus the section, so Escape and Tab still reach onKeyDown.
      tabIndex={-1}
      className="relative rounded-3xl outline-none border border-border bg-card p-5 text-foreground shadow-2xl"
    >
      <button
        onClick={onClose}
        aria-label="Fechar player"
        className="press absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <X size={22} />
      </button>

      <div
        className="relative mx-auto mt-6"
        style={{
          height: "var(--c)",
          width: "calc(var(--c) * 1.5)",
          ["--c" as string]: "min(240px, 52vw)",
        }}
      >
        <div
          className="vinyl absolute grid place-items-center"
          data-spinning={spinning ? "true" : "false"}
          style={{
            width: "calc(var(--c) * 0.9)",
            height: "calc(var(--c) * 0.9)",
            top: "5%",
            left: "calc(var(--c) * 0.6)",
          }}
          aria-hidden="true"
        >
          <div className="relative grid size-[34%] place-items-center overflow-hidden rounded-full bg-primary">
            {cover && <img src={cover} alt="" className="size-full object-cover" />}
            <span className="absolute size-2 rounded-full bg-neutral-900" />
          </div>
        </div>
        <div className="absolute left-0 top-0 z-[1] grid size-[var(--c)] place-items-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl">
          {cover ? (
            <img
              src={cover}
              alt={`Capa de ${currentTrack?.title}`}
              className="size-full object-cover"
            />
          ) : (
            <Music size={56} aria-hidden="true" />
          )}
        </div>
      </div>

      {spotify && <div ref={slotRef} data-spotify-slot className="mt-5 h-[152px] rounded-2xl" />}

      <div className="mt-5 min-w-0">
        <h2 className="truncate text-[20px] font-semibold leading-tight">
          {currentTrack?.title ?? "Nada tocando"}
        </h2>
        {currentTrack?.subtitle && (
          <p className="mt-1 truncate text-base text-muted-foreground">{currentTrack.subtitle}</p>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={progress}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Posição da música"
        className="mt-3 h-11 w-full cursor-pointer accent-[var(--primary)]"
      />
      <div className="-mt-1 flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6">
        <button
          onClick={playPrev}
          aria-label="Anterior"
          className="press grid size-11 place-items-center rounded-full"
        >
          <SkipBack size={24} />
        </button>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          className="press grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-md"
        >
          {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
        </button>
        <button
          onClick={playNext}
          aria-label="Próxima"
          className="press grid size-11 place-items-center rounded-full"
        >
          <SkipForward size={24} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Volume2 size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          disabled={spotify}
          aria-label="Volume"
          className="h-11 min-w-0 flex-1 cursor-pointer accent-[var(--primary)] disabled:cursor-default disabled:opacity-50"
        />
        <div className="flex shrink-0 gap-1" role="group" aria-label="Rotação">
          {([33, 45] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRpm(r)}
              disabled={spotify}
              aria-pressed={rpm === r}
              className={`chip h-11 text-sm disabled:opacity-50 ${rpm === r ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
