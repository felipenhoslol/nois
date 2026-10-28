import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useArchive } from "@/lib/archive-context";
import { CATEGORIES } from "@/lib/categories";
import { usePlayer } from "@/lib/player-context";
import { matchesQuery } from "@/lib/search";

const OPEN_EVENT = "archive:open-palette";
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

const PAGES = [
  { to: "/", label: "Início", icon: "⌂" },
  { to: "/search", label: "Busca", icon: "⌕" },
  { to: "/favorites", label: "Favoritos", icon: "♡" },
  { to: "/box", label: "Lembranças", icon: "✦" },
  { to: "/settings", label: "Configurações", icon: "⚙" },
] as const;

const has = (text: string, q: string) => text.toLowerCase().includes(q.trim().toLowerCase());

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { items } = useArchive();
  const { playTrack } = usePlayer();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (run: () => void) => {
    setOpen(false);
    setQ("");
    run();
  };

  const pages = PAGES.filter((p) => has(p.label, q));
  const drawers = CATEGORIES.filter((c) => has(`${c.label} ${c.plural}`, q));
  const found = q.trim() ? items.filter((i) => matchesQuery(i, q)).slice(0, 20) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Procurar no arquivo</DialogTitle>
        <Command shouldFilter={false}>
          <CommandInput
            value={q}
            onValueChange={setQ}
            placeholder="procurar telas, gavetas, itens..."
          />
          <CommandList>
            <CommandEmpty>Nada por aqui ( ˘･з･) ♡</CommandEmpty>
            {found.length > 0 && (
              <CommandGroup heading="Itens">
                {found.map((i) => (
                  <CommandItem
                    key={i.id}
                    value={`item-${i.id}`}
                    onSelect={() => go(() => navigate({ to: "/item/$id", params: { id: i.id } }))}
                  >
                    <span className="truncate">{i.title}</span>
                    {i.subtitle ? (
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {i.subtitle}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {found.some((i) => i.category === "music" && (i.audioUrl || i.link)) && (
              <CommandGroup heading="Tocar">
                {found
                  .filter((i) => i.category === "music" && (i.audioUrl || i.link))
                  .map((i) => (
                    <CommandItem
                      key={i.id}
                      value={`play-${i.id}`}
                      onSelect={() => go(() => playTrack(i))}
                    >
                      ▶ {i.title}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            {pages.length > 0 && (
              <CommandGroup heading="Ir para">
                {pages.map((p) => (
                  <CommandItem
                    key={p.to}
                    value={`page-${p.to}`}
                    onSelect={() => go(() => navigate({ to: p.to }))}
                  >
                    {p.icon} {p.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {drawers.length > 0 && (
              <CommandGroup heading="Gavetas">
                {drawers.map((c) => (
                  <CommandItem
                    key={c.key}
                    value={`cat-${c.key}`}
                    onSelect={() =>
                      go(() => navigate({ to: "/c/$category", params: { category: c.key } }))
                    }
                  >
                    {c.emoji} {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {drawers.length > 0 && (
              <CommandGroup heading="Novo">
                {drawers.map((c) => (
                  <CommandItem
                    key={c.key}
                    value={`new-${c.key}`}
                    onSelect={() =>
                      go(() => navigate({ to: "/new/$category", params: { category: c.key } }))
                    }
                  >
                    + {c.emoji} Novo em {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
