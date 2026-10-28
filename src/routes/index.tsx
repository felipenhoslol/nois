import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, catMeta } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { ItemCard, RetroClock, SectionTitle, EmptyDrawer } from "@/components/archive-ui";

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
  const recent = items.slice(0, 4);
  const favorites = items.filter((i) => i.favorite).slice(0, 3);
  const counts = CATEGORIES.map((c) => ({
    ...c,
    n: items.filter((i) => i.category === c.key).length,
  })).filter((c) => c.n > 0);
  const last = items[0];

  return (
    <main className="px-4 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
            arquivo pessoal · vol. 01
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            ♡ {settings.archiveName}
          </h1>
          <p className="font-hand text-lg text-muted-foreground">
            {settings.favoriteQuote}
          </p>
        </div>
        <RetroClock />
      </header>

      {/* Featured Polaroid and Stats */}
      <section className="mt-5 flex items-stretch gap-3">
        {last ? (
          <Link
            to="/item/$id"
            params={{ id: last.id }}
            className="polaroid w-1/2 rotate-[-1.5deg] block press cursor-pointer overflow-hidden group"
          >
            {last.image ? (
              <img
                src={last.image}
                alt={last.title}
                className="aspect-square w-full object-cover rounded-sm border border-border/40"
              />
            ) : (
              <div className="grid aspect-square place-items-center bg-secondary text-4xl">
                {catMeta(last.category).emoji}
              </div>
            )}
            <p className="mt-2 truncate text-center font-hand text-base group-hover:text-primary">
              {last.title}
            </p>
            <p className="text-center font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground">
              {catMeta(last.category).label} · {catMeta(last.category).kaomoji}
            </p>
          </Link>
        ) : (
          <div className="polaroid w-1/2 rotate-[-1.5deg]">
            <div className="grid aspect-square place-items-center bg-secondary text-4xl">
              📼
            </div>
            <p className="mt-2 text-center font-hand text-base">primeira lembrança</p>
          </div>
        )}

        <div className="flex w-1/2 flex-col justify-between gap-3">
          <div className="card-object p-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
              memórias guardadas
            </p>
            <p className="font-mono text-3xl tabular-nums">
              {ready ? String(items.length).padStart(2, "0") : "--"}
            </p>
          </div>
          <div className="card-object p-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
              último registro
            </p>
            <p className="mt-0.5 truncate text-sm">{last ? last.title : "—"}</p>
          </div>
        </div>
      </section>

      {/* Quick category badge pill counts */}
      {counts.length > 0 ? (
        <section className="mt-5 flex flex-wrap gap-1.5">
          {counts.map((c) => (
            <Link
              key={c.key}
              to="/c/$category"
              params={{ category: c.key }}
              className="label-chip press bg-card"
            >
              {c.emoji} {c.n} {c.plural}
            </Link>
          ))}
        </section>
      ) : null}

      {/* Categories / Drawers Grid with Kaomojis */}
      <section className="mt-6">
        <SectionTitle>gavetas do arquivo</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const count = items.filter((i) => i.category === c.key).length;
            return (
              <Link
                key={c.key}
                to="/c/$category"
                params={{ category: c.key }}
                className="card-object flex flex-col items-center gap-1 px-2 py-3 text-center group hover:border-primary/60"
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-[0.72rem] font-medium leading-tight">{c.label}</span>
                <span className="font-mono text-[0.55rem] text-muted-foreground/80">
                  {c.kaomoji}
                </span>
                {count > 0 && (
                  <span className="mt-0.5 rounded-full bg-secondary px-1.5 py-0.2 font-mono text-[0.55rem] text-muted-foreground">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Memory Box CTA */}
      <section className="mt-6">
        <SectionTitle
          action={
            <Link to="/box" className="label-chip press">
              abrir caixa
            </Link>
          }
        >
          memory box
        </SectionTitle>
        <Link to="/box" className="card-object block bg-secondary/70 p-4 border-dashed hover:border-primary/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-hand text-xl">Surprise me ♡</p>
              <p className="text-xs text-muted-foreground">
                Abra a caixa e tire uma lembrança aleatória.
              </p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </Link>
      </section>

      {/* Favorites Section */}
      <section className="mt-6">
        <SectionTitle
          action={
            <Link to="/favorites" className="label-chip press">
              ver tudo ({items.filter((i) => i.favorite).length})
            </Link>
          }
        >
          ♡ favoritos
        </SectionTitle>
        <div className="grid gap-2">
          {favorites.length ? (
            favorites.map((i, n) => <ItemCard key={i.id} item={i} index={n} />)
          ) : (
            <EmptyDrawer text="Nenhum favorito ainda ♡" kaomoji="( ˘ ³˘)♥" />
          )}
        </div>
      </section>

      {/* Recent items */}
      <section className="mt-6">
        <SectionTitle>recentemente adicionados</SectionTitle>
        <div className="grid gap-2">
          {recent.length ? (
            recent.map((i, n) => <ItemCard key={i.id} item={i} index={n} />)
          ) : (
            <EmptyDrawer text={catMeta("note").empty} kaomoji="( ⭐ )" />
          )}
        </div>
      </section>
    </main>
  );
}
