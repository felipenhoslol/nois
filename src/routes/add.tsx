import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/categories";

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
      <h1 className="text-3xl font-bold">O que vamos guardar?</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            to="/new/$category"
            params={{ category: c.key }}
            className="surface-row press flex h-24 flex-col items-center justify-center gap-1"
          >
            <span className="text-[28px] leading-none">{c.emoji}</span>
            <span className="text-base font-medium">{c.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
