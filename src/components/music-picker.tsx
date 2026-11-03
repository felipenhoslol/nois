import { useEffect, useState } from "react";
import { parseMusicLink, resolveMusicLink } from "@/lib/music-link";
import { searchTracks, type TrackResult } from "@/lib/music-search";
import { inputClass } from "./archive-ui";

type Status = "idle" | "loading" | "done" | "error";

const Cover = ({ src, size }: { src?: string | undefined; size: string }) =>
  src ? (
    <img src={src} alt="" className={`${size} shrink-0 rounded-xl object-cover`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-xl bg-muted`}>♪</span>
  );

export function MusicPicker({ onPick }: { onPick: (t: TrackResult) => void }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState("");
  const [chosen, setChosen] = useState<TrackResult | null>(null);

  useEffect(() => {
    setNotice("");
    if (!term.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    // Abort the previous request so a slow old answer never replaces a newer one.
    const ctrl = new AbortController();
    const link = parseMusicLink(term);
    const fail = (e: unknown) => {
      if ((e as Error).name !== "AbortError") setStatus("error");
    };
    if (link?.kind === "spotify-other") {
      setResults([]);
      setStatus("idle");
      setNotice("Esse link é de álbum ou playlist. Cole o link de uma música.");
      return;
    }
    const timer = setTimeout(
      () => {
        setStatus("loading");
        if (link) {
          resolveMusicLink(link, ctrl.signal)
            .then((t) => {
              setChosen(t);
              setStatus("idle");
            })
            .catch(fail);
        } else {
          searchTracks(term, ctrl.signal)
            .then((r) => {
              setResults(r);
              setStatus("done");
            })
            .catch(fail);
        }
      },
      link ? 0 : 300,
    );
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  // The picker lives inside the page <form>: Enter must never submit it.
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || (e.target as HTMLElement).tagName !== "INPUT") return;
    e.preventDefault();
    if (chosen?.title.trim()) onPick(chosen);
  };

  if (chosen) {
    return (
      <div className="surface-row grid gap-3" onKeyDown={onEnter}>
        <div className="flex items-center gap-3">
          <Cover src={chosen.artwork} size="h-16 w-16" />
          <div className="grid min-w-0 flex-1 gap-2">
            <input
              autoFocus
              className={inputClass}
              value={chosen.title}
              onChange={(e) => setChosen({ ...chosen, title: e.target.value })}
              placeholder="título da música"
              aria-label="Título"
            />
            <input
              className={inputClass}
              value={chosen.artist}
              onChange={(e) => setChosen({ ...chosen, artist: e.target.value })}
              placeholder="artista"
              aria-label="Artista"
            />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={!chosen.title.trim()}
          onClick={() => onPick(chosen)}
        >
          Guardar música
        </button>
        <button
          type="button"
          className="min-h-11 text-sm text-muted-foreground"
          onClick={() => setChosen(null)}
        >
          Escolher outra
        </button>
      </div>
    );
  }

  return (
    <div onKeyDown={onEnter}>
      <input
        autoFocus
        className={`${inputClass} !min-h-14`}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Busque pelo nome ou cole um link"
        aria-label="Busque pelo nome ou cole um link"
      />
      {notice && <p className="mt-2 text-sm text-muted-foreground">{notice}</p>}
      {status === "loading" && <p className="mt-2 text-sm text-muted-foreground">Buscando…</p>}
      {status === "error" && (
        <p className="mt-2 text-sm text-destructive">Não consegui buscar agora. Tente de novo.</p>
      )}
      {status === "done" && results.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Nada encontrado.</p>
      )}
      {results.length > 0 && (
        <ul className="mt-2 grid gap-2">
          {results.map((t, i) => (
            <li key={`${t.title}-${t.artist}-${i}`}>
              <button
                type="button"
                onClick={() => setChosen(t)}
                className="surface-row press flex w-full items-center gap-3 text-left hover:border-primary"
              >
                <Cover src={t.artwork} size="h-12 w-12" />
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium">{t.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[t.artist, t.album].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
