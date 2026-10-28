import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Início", icon: "⌂" },
  { to: "/search", label: "Buscar", icon: "⌕" },
  { to: "/favorites", label: "Favoritos", icon: "♡" },
  { to: "/box", label: "Lembranças", icon: "✦" },
  { to: "/settings", label: "Ajustes", icon: "⚙" },
] as const;

export function SideNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-paper/70 px-4 py-8 md:flex">
      <div className="px-2">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
          Arquivo pessoal
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Archive</h2>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`press flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/add"
        className="press mt-6 flex items-center justify-center gap-2 rounded-full border border-border bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
      >
        <span className="text-lg leading-none">+</span> Novo registro
      </Link>

      <p className="mt-auto px-2 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
        guardado no seu aparelho
      </p>
    </aside>
  );
}
