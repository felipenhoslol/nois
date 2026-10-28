import { usePlayer } from "@/lib/player-context";
import { catMeta, type Item } from "@/lib/archive";

export function Turntable({ track, onClose }: { track?: Item | null; onClose?: () => void }) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    rpm,
    volume,
    isYouTube,
    youtubeId,
    showVideoEmbed,
    toggleVideoEmbed,
    togglePlay,
    seek,
    setRpm,
    setVolume,
  } = usePlayer();

  const active = track ?? currentTrack;
  const meta = active ? catMeta(active.category) : null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const spinDuration = rpm === 45 ? "1.33s" : "1.8s";

  return (
    <div className="card-object relative overflow-hidden rounded-2xl border-2 border-border/80 bg-paper p-5 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Top Header / Hi-Fi Plate */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 rounded-full ${
              isPlaying ? "bg-emerald-500 animate-pulse" : "bg-neutral-500"
            }`}
          />
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground font-semibold">
            HI-FI TURNTABLE · MODEL T-1994 {meta ? meta.kaomoji : "( ˘ ³˘)♬"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Minimizar toca-discos"
            className="press rounded-full bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕ minimizar
          </button>
        )}
      </div>

      {/* Main Turntable Stage: Vinyl Platter + Mechanical Tonearm */}
      <div className="relative mt-4 flex flex-col md:flex-row items-center justify-center gap-6 py-3">
        {/* Vinyl Platter with concentric sound grooves and custom center cover art */}
        <div className="relative size-60 sm:size-72 shrink-0 rounded-full border-4 border-foreground/15 bg-neutral-950 p-2.5 shadow-[inset_0_0_50px_rgba(0,0,0,0.95),0_12px_30px_rgba(0,0,0,0.55)]">
          {/* Rotating Vinyl Disc */}
          <div
            className="relative size-full rounded-full flex items-center justify-center transition-transform"
            style={{
              animation: isPlaying ? `spin-disc ${spinDuration} linear infinite` : "none",
              backgroundImage:
                "repeating-radial-gradient(circle, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, transparent 2px, transparent 4.5px)",
            }}
          >
            {/* Vinyl Sheen Dynamic Lighting Reflections */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-70" />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-bl from-transparent via-white/5 to-transparent opacity-50" />

            {/* Center Record Label / Custom Album Cover / GIF */}
            <div className="relative size-24 sm:size-28 rounded-full border-2 border-border/80 bg-neutral-900 shadow-inner flex items-center justify-center overflow-hidden">
              {active?.image ? (
                <img
                  src={active.image}
                  alt={active.title}
                  className="size-full object-cover select-none pointer-events-none"
                />
              ) : (
                <div className="size-full bg-primary/85 text-primary-foreground p-2 flex flex-col items-center justify-center text-center">
                  <span className="text-lg leading-none">♬</span>
                  <p className="w-20 truncate font-mono text-[0.55rem] font-bold uppercase tracking-wider mt-0.5">
                    {active?.title || "ARCHIVE"}
                  </p>
                  <p className="w-20 truncate text-[0.45rem] opacity-80">
                    {active?.subtitle || "Side A · 33 RPM"}
                  </p>
                </div>
              )}

              {/* Center Spindle Hole */}
              <div className="absolute size-3.5 rounded-full border border-black/60 bg-zinc-300 shadow-inner z-10" />
            </div>
          </div>
        </div>

        {/* Mechanical Tonearm (Needle arm pivoting onto vinyl record) */}
        <div className="relative h-56 w-24 shrink-0 hidden sm:block">
          {/* Tonearm Base / Pivot Cylinder */}
          <div className="absolute right-4 top-2 size-9 rounded-full border-2 border-neutral-700 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600 shadow-lg">
            <div className="absolute inset-1.5 rounded-full bg-neutral-800" />
          </div>

          {/* Tonearm Arm Assembly (Rotates onto vinyl on play) */}
          <div
            className="absolute right-8 top-6 origin-top transition-transform duration-700 ease-out"
            style={{
              transform: isPlaying ? "rotate(-27deg)" : "rotate(0deg)",
              height: "170px",
              width: "5px",
            }}
          >
            {/* Brushed Chrome Shaft */}
            <div className="h-full w-full rounded-full bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-400 shadow-md" />

            {/* Cartridge & Stylus / Needle Head */}
            <div className="absolute -bottom-2 -left-3 h-7 w-6 rounded-sm bg-neutral-900 border border-amber-600/80 shadow-md flex items-center justify-center">
              <div
                className={`h-1.5 w-2.5 rounded-full ${
                  isPlaying ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-neutral-600"
                }`}
              />
            </div>
          </div>

          {/* Tonearm Rest Cradle */}
          <div className="absolute right-7 bottom-4 h-4 w-6 rounded border border-neutral-600 bg-neutral-400 shadow-sm" />
        </div>
      </div>

      {/* Optional YouTube Video Embed Drawer (when listening to a YouTube track) */}
      {isYouTube && youtubeId && (
        <div className="mt-2 mb-3">
          <div className="flex justify-end mb-1">
            <button
              onClick={toggleVideoEmbed}
              className="label-chip press bg-card text-[0.6rem] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showVideoEmbed ? "ocultar clipe do YouTube" : "assistir clipe do YouTube ✦"}
            </button>
          </div>
          {showVideoEmbed && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/80 shadow-md bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0`}
                title="YouTube Video Clip"
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Retro VFD / LCD Phosphor Digital Display */}
      <div className="mt-3 rounded-xl border border-primary/30 bg-neutral-950 p-3.5 text-primary-foreground font-mono shadow-inner">
        <div className="flex items-center justify-between text-[0.68rem] text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                isPlaying ? "bg-emerald-400 animate-ping" : "bg-neutral-600"
              }`}
            />
            {isPlaying
              ? isYouTube
                ? "PLAYING [YOUTUBE HD]"
                : active?.audioUrl
                ? "PLAYING [AUDIO OK]"
                : "PLAYING [VINYL SYNTH]"
              : "STANDBY [PAUSED]"}
          </span>
          <span className="tracking-widest">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="mt-1 flex items-baseline justify-between">
          <p className="truncate text-base font-bold tracking-wide text-emerald-300">
            {active ? active.title : "Nenhuma faixa selecionada"}
          </p>
          <span className="text-xs text-emerald-400/80 uppercase ml-2 shrink-0">
            {rpm} RPM · STEREO
          </span>
        </div>
        {active?.subtitle && (
          <p className="truncate text-xs text-emerald-400/70">{active.subtitle}</p>
        )}

        {/* Dynamic Stereo VU-Meter Bars */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="text-[0.55rem] text-emerald-500 font-bold w-4">L</span>
          <div className="flex flex-1 gap-0.5 h-1.5 bg-neutral-900 rounded overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`l-${i}`}
                className={`flex-1 transition-opacity duration-100 ${
                  i < 13
                    ? "bg-emerald-500"
                    : i < 17
                    ? "bg-amber-400"
                    : "bg-red-500"
                }`}
                style={{
                  opacity:
                    isPlaying && i < (Math.sin(currentTime * 4 + i) * 7 + 11) ? 1 : 0.15,
                }}
              />
            ))}
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[0.55rem] text-emerald-500 font-bold w-4">R</span>
          <div className="flex flex-1 gap-0.5 h-1.5 bg-neutral-900 rounded overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`r-${i}`}
                className={`flex-1 transition-opacity duration-100 ${
                  i < 13
                    ? "bg-emerald-500"
                    : i < 17
                    ? "bg-amber-400"
                    : "bg-red-500"
                }`}
                style={{
                  opacity:
                    isPlaying && i < (Math.cos(currentTime * 3.5 + i) * 7 + 10) ? 1 : 0.15,
                }}
              />
            ))}
          </div>
        </div>

        {/* Interactive Seek Bar */}
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={100}
            value={progress || 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            aria-label="Posição da música"
          />
        </div>
      </div>

      {/* Tactile Hardware Switches & Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* RPM Speed Selector */}
        <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-md border border-border">
          <button
            onClick={() => setRpm(33)}
            className={`press px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
              rpm === 33
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            33 RPM
          </button>
          <button
            onClick={() => setRpm(45)}
            className={`press px-3 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
              rpm === 45
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            45 RPM
          </button>
        </div>

        {/* Play/Pause Heavy Tactile Button */}
        <button
          onClick={togglePlay}
          className="press flex items-center gap-2 rounded-full bg-primary px-7 py-2.5 font-mono text-sm font-bold text-primary-foreground shadow-lg hover:brightness-110 cursor-pointer"
        >
          <span>{isPlaying ? "❚❚" : "▶"}</span>
          <span>{isPlaying ? "PAUSAR" : "TOCAR"}</span>
        </button>

        {/* Volume Knob */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">VOL</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-primary cursor-pointer"
            aria-label="Volume do toca-discos"
          />
        </div>
      </div>
    </div>
  );
}
