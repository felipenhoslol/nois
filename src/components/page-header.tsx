import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  backTo = "/",
  backLabel = "Voltar",
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.history.push(backTo); // backTo is a plain path string, e.g. "/c/music"
    }
  };

  return (
    <header className="mb-4">
      <button
        onClick={handleBack}
        className="press -ml-3 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full pl-2 pr-4 text-base text-muted-foreground hover:text-foreground"
        aria-label={backLabel}
      >
        <ChevronLeft className="h-6 w-6" aria-hidden />
        <span>{backLabel}</span>
      </button>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[30px] font-bold leading-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
