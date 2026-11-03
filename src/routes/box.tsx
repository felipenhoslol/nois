import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { catMeta } from "@/lib/categories";
import type { Item } from "@/lib/items";
import { useArchive } from "@/lib/archive-context";
import { EmptyDrawer } from "@/components/archive-ui";
import { ItemRow } from "@/components/item-row";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/box")({
  head: () => ({
    meta: [
      { title: "Lembranças — Archive" },
      {
        name: "description",
        content: "Abra a caixa de lembranças e tire uma memória aleatória do arquivo.",
      },
      { property: "og:title", content: "Lembranças — Archive" },
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
    <main className="px-5 pt-6 pb-8">
      <PageHeader
        title="Lembranças"
        subtitle={`${items.length} ${items.length === 1 ? "item guardado" : "itens guardados"}`}
        backTo="/"
        backLabel="Início"
      />

      {items.length === 0 ? (
        <EmptyDrawer text="A caixa ainda está vazia ♡" kaomoji="( ˘ ³˘)♥" />
      ) : (
        <div className="surface-row grid place-items-center gap-4 py-8">
          <div
            className={`text-6xl transition-transform duration-300 ${isOpening ? "scale-110" : ""}`}
            aria-hidden
          >
            {open ? "📭" : "📦"}
          </div>
          <button onClick={surprise} disabled={isOpening} className="press btn-primary">
            {isOpening ? "Abrindo…" : "Tirar uma lembrança"}
          </button>
        </div>
      )}

      {picked && open ? (
        <div className="mt-6" key={picked.id}>
          <p className="mb-2 text-base text-muted-foreground">
            Da gaveta {catMeta(picked.category).label}, guardado em{" "}
            {new Date(picked.createdAt).toLocaleDateString("pt-BR")}
          </p>
          <ItemRow item={picked} />
        </div>
      ) : null}
    </main>
  );
}
