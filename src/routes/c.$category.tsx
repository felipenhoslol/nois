import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { catMeta } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { usePlayer } from "@/lib/player-context";
import { EmptyDrawer, ItemCard, SectionTitle } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";
import { Turntable } from "@/components/turntable";

export const Route = createFileRoute("/c/$category")({
  head: () => ({
    meta: [
      { title: "Gaveta do arquivo — Archive" },
      { name: "description", content: "Todos os itens guardados nesta categoria do arquivo." },
      { property: "og:title", content: "Gaveta do arquivo — Archive" },
      { property: "og:description", content: "Coleção organizada por categoria." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const meta = catMeta(category);
  const { items } = useArchive();
  const { playTrack, currentTrack } = usePlayer();
  const [view, setView] = useState<"list" | "grid" | "cassette">("list");
  const [status, setStatus] = useState<string>("");
  const [showTurntable, setShowTurntable] = useState(category === "music");

  const list = items
    .filter((i) => i.category === meta.key)
    .filter((i) => (status ? i.status === status : true));

  return (
    <main className="px-4 pt-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span>{meta.emoji}</span> {meta.label}
          </span>
        }
        subtitle={`${list.length} ${meta.plural} gravadas`}
        kaomoji={meta.kaomoji}
        backTo="/"
        backLabel="← arquivo"
      />

      {/* Embedded Turntable for Music category */}
      {category === "music" && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
              Aparelho de som analógico
            </span>
            <button
              onClick={() => setShowTurntable(!showTurntable)}
              className="label-chip press bg-card"
            >
              {showTurntable ? "ocultar toca-discos" : "mostrar toca-discos 🎵"}
            </button>
          </div>
          {showTurntable && (
            <div className="anim-in">
              <Turntable track={currentTrack || list[0]} />
            </div>
          )}
        </div>
      )}

      {/* Filters and View mode switches */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setView(view === "list" ? "grid" : view === "grid" ? "cassette" : "list")}
          className="label-chip press bg-card"
        >
          {view === "list" ? "ver capas" : view === "grid" ? "ver fitas" : "ver lista"}
        </button>
        {meta.statuses?.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s === status ? "" : s)}
            className={`press label-chip ${
              s === status ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Items List / Grid / Cassette */}
      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyDrawer text={meta.empty} kaomoji={meta.kaomoji} />
        ) : view === "list" ? (
          <div className="grid gap-2">
            {list.map((i, n) => (
              <ItemCard key={i.id} item={i} index={n} />
            ))}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {list.map((i, n) => (
              <Link
                key={i.id}
                to="/item/$id"
                params={{ id: i.id }}
                className="polaroid anim-in block group cursor-pointer"
                style={{ animationDelay: `${n * 30}ms` }}
              >
                {i.image ? (
                  <img
                    src={i.image}
                    alt={i.title}
                    className="aspect-square w-full object-cover rounded-sm border border-border/40"
                  />
                ) : (
                  <div className="grid aspect-square place-items-center bg-secondary text-3xl">
                    {meta.emoji}
                  </div>
                )}
                <p className="mt-2 truncate text-center font-hand text-base group-hover:text-primary">
                  {i.title}
                </p>
                {i.subtitle && (
                  <p className="truncate text-center font-mono text-[0.6rem] text-muted-foreground">
                    {i.subtitle}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          /* Cassette View */
          <div className="grid gap-3">
            {list.map((i, n) => (
              <div
                key={i.id}
                onClick={() => {
                  if (i.category === "music") playTrack(i);
                }}
                className="card-object p-3 border-2 border-neutral-800 bg-neutral-900 text-neutral-100 rounded-lg cursor-pointer hover:border-primary/80 transition-colors"
                style={{ animationDelay: `${n * 30}ms` }}
              >
                {/* Cassette Tape Face */}
                <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.55rem] font-bold bg-neutral-800 px-1.5 py-0.5 rounded text-primary">
                      TYPE I · NORMAL
                    </span>
                    <p className="font-mono text-xs font-bold truncate max-w-[200px] text-amber-200">
                      {i.title}
                    </p>
                  </div>
                  <span className="font-mono text-[0.6rem] text-neutral-400">SIDE A</span>
                </div>

                {/* Cassette Tape Spools Window */}
                <div className="mt-2.5 flex items-center justify-center gap-6 bg-neutral-950/80 p-2.5 rounded border border-neutral-800">
                  <div className="size-8 rounded-full border-2 border-dashed border-neutral-500 flex items-center justify-center animate-spin">
                    <div className="size-2 rounded-full bg-neutral-400" />
                  </div>
                  <div className="h-2 w-16 bg-neutral-800 rounded flex items-center justify-center">
                    <span className="font-mono text-[0.5rem] text-neutral-500">TAPE</span>
                  </div>
                  <div className="size-8 rounded-full border-2 border-dashed border-neutral-500 flex items-center justify-center animate-spin">
                    <div className="size-2 rounded-full bg-neutral-400" />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-mono text-[0.6rem] truncate">{i.subtitle || "Sem detalhes"}</span>
                  <Link
                    to="/item/$id"
                    params={{ id: i.id }}
                    className="label-chip press text-[0.55rem] border-neutral-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <SectionTitle>adicionar aqui</SectionTitle>
        <Link
          to="/new/$category"
          params={{ category: meta.key }}
          className="press block rounded-[var(--radius)] bg-primary px-4 py-3 text-center font-medium text-primary-foreground shadow-md hover:brightness-105"
        >
          + novo em {meta.label}
        </Link>
      </div>
    </main>
  );
}
