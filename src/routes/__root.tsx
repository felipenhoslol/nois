import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ArchiveProvider } from "../lib/archive-context";
import { PlayerProvider, usePlayer } from "../lib/player-context";
import { BottomNav } from "../components/bottom-nav";
import { SideNav } from "../components/side-nav";
import { MiniPlayer } from "../components/mini-player";
import { Turntable } from "../components/turntable";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Gaveta não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Essa página não existe neste arquivo.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Voltar ao arquivo
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="press rounded-md border border-border bg-card px-4 py-2 text-sm font-medium"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Archive — arquivo pessoal de memórias" },
      {
        name: "description",
        content:
          "Archive é um arquivo pessoal vintage para guardar músicas, presentes, promessas e memórias de quem você ama.",
      },
      { property: "og:title", content: "Archive — arquivo pessoal de memórias" },
      {
        property: "og:description",
        content: "Uma caixa de lembranças digital com estética retrô e analógica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@500;600&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=VT323&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="cassette" data-anim="true">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TurntableModal() {
  const { isTurntableOpen, closeTurntable } = usePlayer();
  if (!isTurntableOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm anim-box">
      <div className="w-full max-w-lg">
        <Turntable onClose={closeTurntable} />
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ArchiveProvider>
        <PlayerProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Navigation */}
            <SideNav />

            {/* Main Application Frame */}
            <div className="grain flex-1 min-w-0 max-w-xl mx-auto pb-28">
              <Outlet />
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* Floating Mini-Player */}
            <MiniPlayer />

            {/* Turntable Modal */}
            <TurntableModal />

            {/* Toast Notifications */}
            <Toaster position="top-center" />

            {/* Background Persistent YouTube Player */}
            <div
              id="archive-yt-player-container"
              style={{
                position: "fixed",
                bottom: -9999,
                left: -9999,
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              <div id="archive-yt-player" />
            </div>
          </div>
        </PlayerProvider>
      </ArchiveProvider>
    </QueryClientProvider>
  );
}

