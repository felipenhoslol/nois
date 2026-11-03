import { Link, useRouterState } from "@tanstack/react-router";
import { openCommandPalette } from "./command-palette";
import { NAV_ITEMS, asTo } from "./bottom-nav";
import { useArchive } from "@/lib/archive-context";

export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useArchive();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-paper px-4 py-8 md:flex">
      <h2 className="px-2 text-2xl font-bold">Archive</h2>

      <nav aria-label="Principal" className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={asTo(to)}
              className={`press flex h-12 items-center gap-3 rounded-2xl px-3 text-base font-medium ${
                primary
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={24} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={openCommandPalette}
        className="press mt-3 flex h-12 items-center justify-between rounded-2xl border border-dashed border-border px-3 text-sm text-muted-foreground hover:text-foreground"
      >
        <span>Procurar</span>
        <kbd className="text-sm">Ctrl K</kbd>
      </button>

      <p className="mt-auto px-2 text-sm text-muted-foreground">
        {user ? "Sincronizado na nuvem ♡" : "Guardado no seu aparelho"}
      </p>
    </aside>
  );
}
