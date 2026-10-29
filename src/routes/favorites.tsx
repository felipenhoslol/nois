import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/categories";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer, SectionTitle } from "@/components/archive-ui";
import { ItemRow } from "@/components/item-row";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favoritos — Archive" },
      {
        name: "description",
        content: "As coisas mais importantes do arquivo, reunidas em um só lugar.",
      },
      { property: "og:title", content: "Favoritos — Archive" },
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
    <main className="px-5 pt-6 pb-8">
      <PageHeader
        title="Favoritos"
        subtitle={`${favs.length} ${favs.length === 1 ? "item marcado" : "itens marcados"}`}
        backTo="/"
        backLabel="Início"
      />

      <div className="mt-5 grid gap-6">
        {grouped.length === 0 ? (
          <EmptyDrawer
            text="Ainda não há nada com coração aqui ♡"
            kaomoji="( ˘ ³˘)♥"
            action={
              <Link to="/" className="press btn-primary">
                Ver o arquivo
              </Link>
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
