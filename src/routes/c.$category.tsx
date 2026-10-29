import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { catMeta } from "@/lib/categories";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer, ItemCardSkeleton } from "@/components/archive-ui";
import { ItemRow } from "@/components/item-row";
import { PageHeader } from "@/components/page-header";
import { NowPlaying } from "@/components/now-playing";

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
  const { items, ready } = useArchive();
  const [status, setStatus] = useState<string>("");

  const list = items
    .filter((i) => i.category === meta.key)
    .filter((i) => (status ? i.status === status : true));

  return (
    <main className="px-5 pt-6 pb-8">
      <PageHeader
        title={`${meta.emoji} ${meta.label}`}
        subtitle={`${list.length} ${meta.plural}`}
        backTo="/"
        backLabel="Início"
      />

      {category === "music" && <NowPlaying />}

      {meta.statuses?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s === status ? "" : s)}
              aria-pressed={s === status}
              className={`press chip min-h-11 cursor-pointer ${
                s === status ? "border-primary bg-primary text-primary-foreground" : "bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {!ready ? (
          <ItemCardSkeleton count={4} />
        ) : list.length === 0 ? (
          <EmptyDrawer
            text={meta.empty}
            kaomoji={meta.kaomoji}
            action={
              <Link
                to="/new/$category"
                params={{ category: meta.key }}
                className="press btn-primary"
              >
                Adicionar
              </Link>
            }
          />
        ) : (
          <div className="grid gap-2">
            {list.map((i) => (
              <ItemRow key={i.id} item={i} />
            ))}
          </div>
        )}
      </div>

      {list.length > 0 && (
        <Link
          to="/new/$category"
          params={{ category: meta.key }}
          className="press btn-primary mt-6 w-full"
        >
          Adicionar em {meta.label}
        </Link>
      )}
    </main>
  );
}
