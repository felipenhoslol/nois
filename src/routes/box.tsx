import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { catMeta, type Item } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/box")({
  head: () => ({
    meta: [
      { title: "Memory Box — Archive" },
      {
        name: "description",
        content: "Abra a caixa de lembranças e tire uma memória aleatória do arquivo.",
      },
      { property: "og:title", content: "Memory Box — Archive" },
      { property: "og:description", content: "Uma caixa antiga cheia de pequenas lembranças." },
    ],
  }),
  component: MemoryBox,
});

function MemoryBox() {
  const { items } = useArchive();
  const [picked, setPicked] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  function surprise() {
    if (!items.length) return;
    setIsOpening(true);
    setOpen(false);

    setTimeout(() => {
      const next = items[Math.floor(Math.random() * items.length)]!;
      setPicked(next);
      setOpen(true);
      setIsOpening(false);
    }, 450);
  }

  return (
    <main className="px-4 pt-6">
      <PageHeader
        title="Memory Box"
        subtitle="uma caixa antiga com pedacinhos guardados"
        kaomoji="(づ๑•ᴗ•๑)づ ✦"
        backTo="/"
        backLabel="← arquivo"
      />

      <div className="card-object mt-4 overflow-hidden bg-secondary/60 border-2 border-border/80">
        <div className="border-b border-border px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
          <span>caixa nº 01 · {items.length} lembranças</span>
          <span>(｡♥‿♥｡)</span>
        </div>

        <div className="grid place-items-center gap-4 px-4 py-8">
          <div className={`text-6xl transition-transform duration-300 ${isOpening ? "scale-125 rotate-6" : ""}`}>
            {open ? "📭" : "📦"}
          </div>
          <button
            onClick={surprise}
            disabled={isOpening || items.length === 0}
            className="press rounded-full bg-primary px-7 py-3 font-mono text-sm font-bold text-primary-foreground shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {isOpening ? "Abrindo a caixa..." : "Surprise me ♡"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyDrawer text="A caixa ainda está vazia ♡" kaomoji="( ˘ ³˘)♥" />
        ) : picked && open ? (
          <div className="space-y-2">
            <p className="text-center font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
              ✦ Você retirou da caixa ✦
            </p>
            <Link
              to="/item/$id"
              params={{ id: picked.id }}
              key={picked.id}
              className="polaroid anim-box block rotate-[-1.5deg] max-w-sm mx-auto shadow-xl hover:rotate-0 transition-transform"
            >
              {picked.image ? (
                <img
                  src={picked.image}
                  alt={picked.title}
                  className="aspect-[4/3] w-full object-cover rounded-sm border border-border/40"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-secondary text-5xl">
                  {catMeta(picked.category).emoji}
                </div>
              )}
              <p className="mt-2 text-center font-hand text-2xl font-bold">{picked.title}</p>
              {picked.subtitle && (
                <p className="text-center text-xs text-muted-foreground">{picked.subtitle}</p>
              )}
              <p className="mt-1 text-center font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                {catMeta(picked.category).label} · {new Date(picked.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
