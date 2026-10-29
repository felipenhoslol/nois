import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { THEMES } from "@/lib/themes";
import { useArchive } from "@/lib/archive-context";
import { Field, SectionTitle, inputClass } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";
import { SyncSection } from "@/components/sync-section";
import { parseBackup } from "@/lib/sync";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Archive" },
      {
        name: "description",
        content: "Escolha o tema deste aparelho, ajuste o arquivo e exporte seus dados.",
      },
      { property: "og:title", content: "Configurações — Archive" },
      {
        property: "og:description",
        content: "Tema, nome do arquivo e dados do seu arquivo.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, device, updateDevice, updateSettings, items, resetAll, replaceAll, user } =
    useArchive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify({ items, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archive-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo de backup baixado com sucesso!");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let backup: ReturnType<typeof parseBackup>;
      try {
        backup = parseBackup(JSON.parse(event.target?.result as string));
      } catch {
        toast.error("Esse arquivo não parece um backup do Archive.");
        return;
      }
      if (!confirm(`Restaurar ${backup.items.length} registros? Isso substitui o arquivo atual.`)) {
        return;
      }
      replaceAll(backup.items, backup.settings);
      toast.success("Backup restaurado ♡");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const row = "surface-row min-h-11 w-full text-left text-sm cursor-pointer";
  return (
    <main className="px-4 pt-6 pb-16">
      <PageHeader title="Ajustes" backTo="/" backLabel="Início" />

      <section className="mt-4 grid gap-3">
        <SectionTitle>Seu tema</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const on = device.theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => updateDevice({ theme: t.key })}
                className={`min-h-11 cursor-pointer rounded-xl bg-card p-2 text-left ${
                  on ? "border-2 border-primary" : "border border-border"
                }`}
              >
                <span
                  className="block rounded-lg p-3"
                  style={{
                    background: t.tokens.background,
                    border: `1px solid ${t.tokens.border}`,
                  }}
                >
                  <span className="block text-xs" style={{ color: t.tokens.foreground }}>
                    Aa
                  </span>
                  <span
                    className="mt-2 block size-3 rounded-full"
                    style={{ background: t.tokens.primary }}
                  />
                </span>
                <span className="mt-2 block text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Só neste aparelho</p>
      </section>

      <section className="mt-8 grid gap-3">
        <SectionTitle>Arquivo</SectionTitle>
        <Field label="Nome do arquivo">
          <input
            className={inputClass}
            value={settings.archiveName}
            onChange={(e) => updateSettings({ archiveName: e.target.value })}
          />
        </Field>
        <Field label="Frase favorita">
          <input
            className={inputClass}
            value={settings.favoriteQuote}
            onChange={(e) => updateSettings({ favoriteQuote: e.target.value })}
          />
        </Field>
        <Field label="Como chamar a pessoa">
          <input
            className={inputClass}
            value={settings.personName}
            onChange={(e) => updateSettings({ personName: e.target.value })}
          />
        </Field>
      </section>

      <section className="mt-8 grid gap-2">
        <SectionTitle>Animações</SectionTitle>
        <div className="surface-row flex min-h-11 items-center justify-between text-sm">
          <span id="anim-label">Animações e transições</span>
          <button
            type="button"
            role="switch"
            aria-checked={device.animations}
            aria-labelledby="anim-label"
            onClick={() => updateDevice({ animations: !device.animations })}
            className="flex size-11 cursor-pointer items-center justify-center"
          >
            <span
              className={`grid h-6 w-11 items-center rounded-full border border-border px-0.5 ${
                device.animations ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`size-5 rounded-full bg-card ${device.animations ? "translate-x-5" : ""}`}
              />
            </span>
          </button>
        </div>
      </section>

      <div className="mt-8">
        <SyncSection />
      </div>

      <section className="mt-8 grid gap-2">
        <SectionTitle>Backup</SectionTitle>
        <button type="button" onClick={exportData} className={row}>
          Exportar backup completo (.json)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className={row}>
          Restaurar backup (.json)
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              confirm("Tem certeza que deseja apagar todo o arquivo? Esta ação é irreversível.")
            ) {
              resetAll();
              toast.success("Arquivo resetado.");
            }
          }}
          className={`${row} text-destructive`}
        >
          Apagar todos os dados do arquivo
        </button>
        <p className="px-1 text-xs text-muted-foreground">
          {user
            ? "Suas informações ficam neste aparelho e na sua conta. Apagar aqui apaga na nuvem também."
            : "Suas informações ficam salvas de forma 100% privada neste aparelho."}
        </p>
      </section>
    </main>
  );
}
