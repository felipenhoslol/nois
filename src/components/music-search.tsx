import { useEffect, useState } from "react";
import { searchTracks, type TrackResult } from "@/lib/music-search";
import { Field, inputClass } from "./archive-ui";

type Status = "idle" | "loading" | "done" | "error";

export function MusicSearch({ onPick }: { onPick: (t: TrackResult) => void }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    // Abort the previous request so a slow old answer never replaces a newer one.
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      searchTracks(term, ctrl.signal)
        .then((r) => {
          setResults(r);
          setStatus("done");
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== "AbortError") setStatus("error");
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  function pick(t: TrackResult) {
    onPick(t);
    setTerm("");
  }

  return (
    <div>
      <Field label="Buscar música (preenche tudo pra você)">
        <input
          className={inputClass}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="nome da música ou artista..."
          aria-label="Buscar música"
        />
      </Field>
      {status === "loading" && <p className="mt-1 text-xs text-muted-foreground">buscando…</p>}
      {status === "error" && (
        <p className="mt-1 text-xs text-destructive">não consegui buscar agora, tenta de novo ♡</p>
      )}
      {status === "done" && results.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">nada encontrado ♡</p>
      )}
      {results.length > 0 && (
        <ul className="mt-2 grid gap-1">
          {results.map((t, i) => (
            <li key={`${t.title}-${t.artist}-${i}`}>
              <button
                type="button"
                onClick={() => pick(t)}
                className="press flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left hover:border-primary"
              >
                {t.artwork ? (
                  <img src={t.artwork} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted">
                    ♪
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
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
