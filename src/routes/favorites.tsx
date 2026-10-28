import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer, ItemCard, SectionTitle } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "♡ Favorites — Archive" },
      {
        name: "description",
        content: "As coisas mais importantes do arquivo, reunidas em um só lugar.",
      },
      { property: "og:title", content: "♡ Favorites — Archive" },
      { property: "og:description", content: "Os favoritos do seu arquivo pessoal." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { items } = useArchive();
  const favs = items.filter((i) => i.favorite);
  const grouped = CATEGORIES.map((c) => ({
    meta: c,
    list: favs.filter((i) => i.category === c.key),
  })).filter((g) => g.list.length);

  return (
    <main className="px-4 pt-6">
      <PageHeader
        title="♡ Favorites"
        subtitle={`${favs.length} lembranças marcadas no coração`}
        kaomoji="( ˘ ³˘)♥"
        backTo="/"
        backLabel="← arquivo"
      />

      <div className="mt-5 grid gap-5">
        {grouped.length === 0 ? (
          <EmptyDrawer text="Ainda não há nada com coração aqui ♡" kaomoji="( ˘ ³˘)♥" />
        ) : (
          grouped.map((g) => (
            <section key={g.meta.key}>
              <SectionTitle>
                {g.meta.emoji} {g.meta.label} · {g.meta.kaomoji}
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
