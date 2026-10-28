import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/archive";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Adicionar ao arquivo — Archive" },
      {
        name: "description",
        content: "Guarde uma música, presente, comentário, memória ou promessa em segundos.",
      },
      { property: "og:title", content: "Adicionar ao arquivo — Archive" },
      {
        property: "og:description",
        content: "Adição rápida de itens ao seu arquivo pessoal.",
      },
    ],
  }),
  component: AddMenu,
});

function AddMenu() {
  return (
    <main className="px-4 pt-6">
      <PageHeader
        title="O que você quer guardar?"
        subtitle="escolha uma gaveta do arquivo"
        kaomoji="( ˶ˆᗜˆ˵ ) ✦"
        backTo="/"
        backLabel="← arquivo"
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        {CATEGORIES.map((c, n) => (
          <Link
            key={c.key}
            to="/new/$category"
            params={{ category: c.key }}
            className="card-object anim-in flex flex-col p-3 hover:border-primary/70 transition-colors group cursor-pointer"
            style={{ animationDelay: `${n * 20}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{c.emoji}</span>
              <span className="font-mono text-[0.55rem] text-muted-foreground">
                {c.kaomoji}
              </span>
            </div>
            <span className="mt-2 text-sm font-semibold group-hover:text-primary leading-tight">
              {c.label}
            </span>
            <span className="text-[0.62rem] text-muted-foreground truncate mt-0.5">
              {c.empty.slice(0, 30)}…
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
