import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Music, Plus, Settings, type LucideIcon } from "lucide-react";

export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; primary?: boolean }[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/c/music", label: "Músicas", icon: Music },
  { to: "/add", label: "Adicionar", icon: Plus, primary: true },
  { to: "/favorites", label: "Favoritos", icon: Heart },
  { to: "/settings", label: "Ajustes", icon: Settings },
];

// "/c/music" is a param route; cast keeps Link's typed paths happy.
export const asTo = (to: string) => to as "/";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-paper md:hidden"
    >
      <div className="mx-auto grid max-w-[640px] grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to;
          return primary ? (
            <div key={to} className="flex flex-col items-center gap-0.5">
              <Link
                to={asTo(to)}
                aria-label={label}
                className="press -mt-6 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-md"
              >
                <Icon size={28} aria-hidden />
              </Link>
              <span className="text-[13px] leading-none text-muted-foreground">{label}</span>
            </div>
          ) : (
            <Link
              key={to}
              to={asTo(to)}
              aria-label={label}
              className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={24} aria-hidden />
              <span className="text-[13px] leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
