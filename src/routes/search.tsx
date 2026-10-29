import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useArchive } from "@/lib/archive-context";
import { matchesQuery } from "@/lib/search";
import { EmptyDrawer, SectionTitle, inputClass } from "@/components/archive-ui";
import { ItemRow } from "@/components/item-row";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Procurar — Archive" },
      {
        name: "description",
        content: "Pesquise em todo o arquivo: roupas, marcas, presentes, memórias e comentários.",
      },
      { property: "og:title", content: "Procurar — Archive" },
      { property: "og:description", content: "Encontre qualquer lembrança guardada." },
    ],
  }),
  component: SearchPage,
});

const chipClass = (on: boolean) =>
  `press chip min-h-11 cursor-pointer ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`;

function SearchPage() {
  const { items } = useArchive();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.tags))).slice(0, 14),
    [items],
  );

  const results = items
    .filter((i) => (cat ? i.category === cat : true))
    .filter((i) => (onlyFav ? i.favorite : true))
    .filter((i) => matchesQuery(i, q));

  const grouped = CATEGORIES.map((c) => ({
    meta: c,
    list: results.filter((i) => i.category === c.key),
  })).filter((g) => g.list.length);

  const filtered = Boolean(q || cat || onlyFav);

  return (
    <main className="px-5 pt-6 pb-8">
      <PageHeader
        title="Procurar"
        subtitle="Palavras, tags ou gavetas"
        backTo="/"
        backLabel="Início"
      />

      <input
        type="search"
        className={`${inputClass} min-h-[52px]`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="jaqueta, jazz, #nostalgia…"
        aria-label="Procurar no arquivo"
        autoFocus
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setOnlyFav((f) => !f)}
          aria-pressed={onlyFav}
          className={chipClass(onlyFav)}
        >
          ♡ Favoritos
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key === cat ? "" : c.key)}
            aria-pressed={c.key === cat}
            className={chipClass(c.key === cat)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {allTags.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags</span>
          {allTags.map((t) => (
            <button key={t} onClick={() => setQ(t)} className={chipClass(q === t)}>
              #{t}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6">
        {grouped.length === 0 ? (
          <EmptyDrawer
            text="Nada encontrado."
            kaomoji="( ｡•́‿•̀｡)"
            action={
              filtered ? (
                <button
                  onClick={() => {
                    setQ("");
                    setCat("");
                    setOnlyFav(false);
                  }}
                  className="press btn-primary"
                >
                  Limpar filtros
                </button>
              ) : (
                <span />
              )
            }
          />
        ) : (
          grouped.map((g) => (
            <section key={g.meta.key}>
              <SectionTitle>
                {g.meta.emoji} {g.meta.label}
              </SectionTitle>
              <div className="grid gap-2">
                {g.list.map((i) => (
                  <ItemRow key={i.id} item={i} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
