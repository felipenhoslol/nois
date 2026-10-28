import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  kaomoji,
  backTo = "/",
  backLabel = "← voltar",
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  kaomoji?: string;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: backTo as any });
    }
  };

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="label-chip press bg-card inline-flex items-center gap-1.5 cursor-pointer font-medium hover:border-primary/60 text-foreground transition-colors"
          aria-label={backLabel}
        >
          <span>←</span> <span>{backLabel.replace(/^[←\s]+/, "") || "voltar"}</span>
        </button>
        {kaomoji && (
          <span className="font-mono text-xs text-muted-foreground tracking-widest select-none">
            {kaomoji}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground font-mono">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
