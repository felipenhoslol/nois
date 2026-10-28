import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/search", label: "Buscar", icon: "⌕" },
  { to: "/favorites", label: "Favoritos", icon: "♡" },
  { to: "/settings", label: "Ajustes", icon: "⚙" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-border bg-paper/95 backdrop-blur md:hidden">
      <div className="relative grid grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} active={pathname === t.to} />
        ))}
        <div className="flex justify-center">
          <Link
            to="/add"
            aria-label="Adicionar"
            className="press -mt-7 grid size-14 place-items-center rounded-full border border-border bg-primary text-2xl text-primary-foreground shadow-[0_8px_20px_-10px_rgba(0,0,0,0.7)]"
          >
            +
          </Link>
        </div>
        {tabs.slice(2).map((t) => (
          <Tab key={t.to} {...t} active={pathname === t.to} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`press flex flex-col items-center gap-0.5 py-1 ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em]">{label}</span>
    </Link>
  );
}
