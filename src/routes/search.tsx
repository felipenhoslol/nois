import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES, catMeta } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer, ItemCard, SectionTitle, inputClass } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Busca global — Archive" },
      {
        name: "description",
        content: "Pesquise em todo o arquivo: roupas, marcas, presentes, memórias e comentários.",
      },
      { property: "og:title", content: "Busca global — Archive" },
      { property: "og:description", content: "Encontre qualquer lembrança guardada." },
    ],
  }),
  component: SearchPage,
});

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
    .filter((i) => {
      if (!q.trim()) return true;
      const hay = [i.title, i.subtitle, i.notes, i.reason, i.status, i.place, ...i.tags]
        .join(" ")
        .toLowerCase();
      return hay.includes(q.toLowerCase().replace(/^#/, ""));
    });

  const grouped = CATEGORIES.map((c) => ({
    meta: c,
    list: results.filter((i) => i.category === c.key),
  })).filter((g) => g.list.length);

  return (
    <main className="px-4 pt-6">
      <PageHeader
        title="Busca no Arquivo"
        subtitle="pesquise por palavras, tags ou gavetas"
        kaomoji="( ⚆ _ ⚆ ) ✦"
        backTo="/"
        backLabel="← arquivo"
      />

      <input
        className={`${inputClass} mt-1 text-base`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="jaqueta, toca-discos, #nostalgia, jazz..."
        autoFocus
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setOnlyFav((f) => !f)}
          className={`press label-chip ${onlyFav ? "bg-primary text-primary-foreground" : "bg-card"}`}
        >
          ♡ favoritos
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key === cat ? "" : c.key)}
            className={`press label-chip ${
              c.key === cat ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {allTags.length ? (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[0.6rem] text-muted-foreground uppercase">Tags:</span>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setQ(t)}
              className="press font-hand text-base hover:text-primary transition-colors"
            >
              #{t}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5">
        {grouped.length === 0 ? (
          <EmptyDrawer text="Nada encontrado nesta gaveta ♡" kaomoji="( ｡•́‿•̀｡)" />
        ) : (
          grouped.map((g) => (
            <section key={g.meta.key}>
              <SectionTitle>
                {catMeta(g.meta.key).emoji} {g.meta.label} · {g.list.length} item(ns)
              </SectionTitle>
              <div className="grid gap-2">
                {g.list.map((i, n) => (
                  <ItemCard key={i.id} item={i} index={n} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
