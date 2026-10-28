import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { useArchive } from "@/lib/archive-context";
import { pickHomeDrawers } from "@/lib/home";
import { SectionTitle, EmptyDrawer } from "@/components/archive-ui";
import { ItemRow } from "@/components/item-row";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "♡ My Archive — início" },
      {
        name: "description",
        content:
          "A página inicial do seu arquivo pessoal: contadores, favoritos e as últimas lembranças guardadas.",
      },
      { property: "og:title", content: "♡ My Archive — início" },
      {
        property: "og:description",
        content: "Guarde músicas, presentes, promessas e memórias em um só lugar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { items, settings, ready } = useArchive();
  const [allDrawers, setAllDrawers] = useState(false);
  const recent = items.slice(0, 6);
  const drawers = allDrawers ? CATEGORIES : pickHomeDrawers(items);

  return (
    <main className="px-5 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">oi, vocês dois ♡</p>
        <h1 className="mt-1 break-words text-3xl font-bold">{settings.archiveName}</h1>
        <p className="mt-1 text-base text-muted-foreground">{settings.favoriteQuote}</p>
      </header>

      <Link
        to="/search"
        className="surface-row press mt-5 flex !min-h-[52px] items-center gap-3 text-muted-foreground"
      >
        <Search className="h-5 w-5" aria-hidden />
        <span className="text-base">Procurar</span>
      </Link>

      <Link
        to="/add"
        className="btn-primary press mt-3 flex w-full items-center justify-center gap-2"
      >
        <Plus className="h-5 w-5" aria-hidden />
        Adicionar
      </Link>

      <section className="mt-8">
        <SectionTitle>Últimos guardados</SectionTitle>
        <div className="grid gap-2">
          {!ready ? (
            <div className="grid gap-2" aria-busy="true" aria-label="carregando">
              {[0, 1, 2].map((n) => (
                <div key={n} className="surface-row animate-pulse bg-muted" />
              ))}
            </div>
          ) : recent.length ? (
            recent.map((i) => <ItemRow key={i.id} item={i} />)
          ) : (
            <EmptyDrawer
              text="Nada guardado ainda"
              action={
                <Link to="/add" className="press btn-primary">
                  Adicionar
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>Gavetas</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {drawers.map((c) => (
            <Link
              key={c.key}
              to="/c/$category"
              params={{ category: c.key }}
              className="chip press min-h-11 bg-card"
            >
              {c.emoji} {c.label}
            </Link>
          ))}
          <button
            type="button"
            aria-expanded={allDrawers}
            onClick={() => setAllDrawers((v) => !v)}
            className="chip press min-h-11"
          >
            {allDrawers ? "Menos gavetas" : "Todas as gavetas"}
          </button>
        </div>
      </section>

      <p className="mt-8 pb-4">
        <Link to="/box" className="text-sm text-muted-foreground underline underline-offset-4">
          Abrir uma lembrança surpresa
        </Link>
      </p>
    </main>
  );
}
