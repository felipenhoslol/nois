import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { THEMES, type CustomTheme, type Settings } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { Field, SectionTitle, inputClass } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Archive" },
      {
        name: "description",
        content: "Escolha temas, personalize cores estilo MySpace, ajuste privacidade e exporte seus dados.",
      },
      { property: "og:title", content: "Configurações — Archive" },
      { property: "og:description", content: "Aparência, temas MySpace, privacidade e dados do seu arquivo." },
    ],
  }),
  component: SettingsPage,
});

const WALLPAPERS: { key: Settings["wallpaper"]; label: string; desc: string }[] = [
  { key: "clean", label: "Limpo", desc: "Fundo analógico suave" },
  { key: "dots", label: "Pontilhado", desc: "Dots retrô minimalistas" },
  { key: "grid", label: "Caderno", desc: "Papel quadriculado clássico" },
  { key: "crt", label: "CRT Monitor", desc: "Scanlines de monitor antigo" },
  { key: "paper", label: "Pergaminho", desc: "Textura de papel envelhecido" },
  { key: "stars", label: "Estrelas", desc: "Céu estrelado retrô" },
  { key: "sparkles", label: "Sparkles 90s", desc: "Brilhos nostálgicos" },
  { key: "custom", label: "GIF / Imagem Custom", desc: "Seu próprio papel de parede" },
];

const FONTS: { key: CustomTheme["font"]; label: string; preview: string }[] = [
  { key: "sans", label: "Sans Moderna", preview: "DM Sans" },
  { key: "serif", label: "Retrô Serif", preview: "Playfair Display" },
  { key: "mono", label: "Terminal Mono", preview: "JetBrains Mono" },
  { key: "pixel", label: "Pixel 90s Arcade", preview: "VT323 Pixel" },
  { key: "hand", label: "Cursiva Caderno", preview: "Caveat" },
];

const BORDERS: { key: CustomTheme["borderStyle"]; label: string }[] = [
  { key: "solid", label: "Clássica (Sólida)" },
  { key: "dashed", label: "Tracejada Caderno" },
  { key: "double", label: "Dupla Retrô" },
  { key: "retro", label: "Sombra 90s" },
  { key: "none", label: "Minimalista" },
];

const DEFAULT_CUSTOM_THEME: CustomTheme = {
  primary: "#d946ef",
  secondary: "#f5d0fe",
  background: "#18181b",
  surface: "#27272a",
  textColor: "#fafafa",
  font: "pixel",
  borderStyle: "retro",
  wallpaper: "stars",
  customWallpaperUrl: "",
};

function SettingsPage() {
  const { settings, updateSettings, items, resetAll } = useArchive();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "myspace">(
    settings.useCustomTheme ? "myspace" : "presets",
  );

  const custom = settings.customTheme ?? DEFAULT_CUSTOM_THEME;

  function updateCustomTheme(patch: Partial<CustomTheme>) {
    const updated = { ...custom, ...patch };
    updateSettings({
      useCustomTheme: true,
      customTheme: updated,
    });
  }

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
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items && Array.isArray(data.items)) {
          localStorage.setItem("archive.items.v1", JSON.stringify(data.items));
          if (data.settings) {
            localStorage.setItem("archive.settings.v1", JSON.stringify(data.settings));
          }
          toast.success("Backup importado com sucesso! Recarregando...");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error("Formato de backup inválido.");
        }
      } catch {
        toast.error("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="px-4 pt-6 pb-16">
      <PageHeader
        title="Configurações"
        subtitle="personalização, temas MySpace & dados"
        kaomoji="( ⸝⸝•ᴗ•⸝⸝ )"
        backTo="/"
        backLabel="← arquivo"
      />

      <section className="mt-4 grid gap-3">
        <SectionTitle>identidade do arquivo</SectionTitle>
        <Field label="Nome do arquivo">
          <input
            className={inputClass}
            value={settings.archiveName}
            onChange={(e) => updateSettings({ archiveName: e.target.value })}
          />
        </Field>
        <Field label="Frase favorita do cabeçalho">
          <input
            className={inputClass}
            value={settings.favoriteQuote}
            onChange={(e) => updateSettings({ favoriteQuote: e.target.value })}
          />
        </Field>
      </section>

      {/* Theme Mode Selector: Presets vs MySpace Customizer */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>estilo & estética</SectionTitle>
          <div className="flex gap-1 bg-card rounded-md p-0.5 border border-border">
            <button
              onClick={() => {
                setActiveTab("presets");
                updateSettings({ useCustomTheme: false });
                toast.success("Temas clássicos ativados");
              }}
              className={`press px-3 py-1 text-xs font-mono rounded cursor-pointer ${
                !settings.useCustomTheme && activeTab === "presets"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Temas Originais
            </button>
            <button
              onClick={() => {
                setActiveTab("myspace");
                updateSettings({
                  useCustomTheme: true,
                  customTheme: custom,
                });
                toast.success("Modo Personalizador MySpace ativado! ✦");
              }}
              className={`press px-3 py-1 text-xs font-mono rounded cursor-pointer ${
                settings.useCustomTheme || activeTab === "myspace"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              ✦ Criar MySpace
            </button>
          </div>
        </div>

        {/* Tab 1: Original Preset Themes */}
        {!settings.useCustomTheme && activeTab === "presets" ? (
          <div className="space-y-4 anim-in">
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    updateSettings({ theme: t.key, useCustomTheme: false });
                    toast.success(`Tema "${t.label}" aplicado ♡`);
                  }}
                  className={`card-object press p-3 text-left text-sm cursor-pointer ${
                    settings.theme === t.key && !settings.useCustomTheme
                      ? "border-primary ring-2 ring-primary/20"
                      : ""
                  }`}
                >
                  <span className="font-medium block">{t.label}</span>
                  <span className="mt-1 block font-mono text-[0.55rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {settings.theme === t.key && !settings.useCustomTheme
                      ? "em uso ✓"
                      : "aplicar"}
                  </span>
                </button>
              ))}
            </div>

            {/* Wallpapers for Preset Themes */}
            <div className="pt-2">
              <SectionTitle>textura de fundo</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {WALLPAPERS.filter((w) => w.key !== "custom").map((w) => (
                  <button
                    key={w.key}
                    onClick={() => {
                      updateSettings({ wallpaper: w.key });
                      toast.success(`Fundo "${w.label}" ativado`);
                    }}
                    className={`card-object press p-3 text-left text-sm cursor-pointer ${
                      (settings.wallpaper ?? "clean") === w.key
                        ? "border-primary ring-2 ring-primary/20"
                        : ""
                    }`}
                  >
                    <span className="font-medium block">{w.label}</span>
                    <span className="mt-0.5 block font-mono text-[0.55rem] text-muted-foreground">
                      {w.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: MySpace Custom Theme Builder */
          <div className="space-y-5 anim-in card-object p-4 border-2 border-primary/40 bg-secondary/30">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
                ✦ MySpace Retro Theme Studio ✦
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personalize cores, plano de fundo com GIFs ou fotos, tipografia pixel e bordas.
              </p>
            </div>

            {/* Live MySpace Profile Card Preview */}
            <div className="p-3.5 rounded-xl border border-border bg-card shadow-lg space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  ( ˘ ³˘)♥ Prévia em tempo real
                </span>
                <span className="font-mono text-[0.62rem] text-primary">★ Online Now!</span>
              </div>
              <p className="text-base font-bold">Título de Exemplo no MySpace</p>
              <p className="text-xs text-muted-foreground">
                “Ouvindo Chet Baker no toca-discos em um dia chuvoso...”
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="label-chip bg-primary text-primary-foreground text-[0.62rem]"
                >
                  ▶ Tocar Música
                </button>
                <button
                  type="button"
                  className="label-chip bg-secondary text-foreground text-[0.62rem]"
                >
                  + Add Friend
                </button>
              </div>
            </div>

            {/* Colors Section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Cor Principal / Destaque">
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={custom.primary}
                    onChange={(e) => updateCustomTheme({ primary: e.target.value })}
                    className="size-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    className={`${inputClass} text-xs font-mono uppercase`}
                    value={custom.primary}
                    onChange={(e) => updateCustomTheme({ primary: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="Fundo da Tela">
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={custom.background}
                    onChange={(e) => updateCustomTheme({ background: e.target.value })}
                    className="size-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    className={`${inputClass} text-xs font-mono uppercase`}
                    value={custom.background}
                    onChange={(e) => updateCustomTheme({ background: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="Cor dos Cartões">
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={custom.surface}
                    onChange={(e) => updateCustomTheme({ surface: e.target.value })}
                    className="size-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    className={`${inputClass} text-xs font-mono uppercase`}
                    value={custom.surface}
                    onChange={(e) => updateCustomTheme({ surface: e.target.value })}
                  />
                </div>
              </Field>

              <Field label="Cor do Texto">
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={custom.textColor ?? "#ffffff"}
                    onChange={(e) => updateCustomTheme({ textColor: e.target.value })}
                    className="size-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    className={`${inputClass} text-xs font-mono uppercase`}
                    value={custom.textColor ?? "#ffffff"}
                    onChange={(e) => updateCustomTheme({ textColor: e.target.value })}
                  />
                </div>
              </Field>
            </div>

            {/* Typography / Font Style */}
            <div>
              <SectionTitle>tipografia retrô</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => updateCustomTheme({ font: f.key })}
                    className={`card-object press p-2.5 text-left text-xs cursor-pointer ${
                      custom.font === f.key ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <span className="font-bold block">{f.label}</span>
                    <span className="text-[0.65rem] text-muted-foreground block mt-0.5">
                      {f.preview}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Border Style */}
            <div>
              <SectionTitle>estilo de moldura e bordas</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BORDERS.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => updateCustomTheme({ borderStyle: b.key })}
                    className={`card-object press p-2.5 text-left text-xs cursor-pointer ${
                      custom.borderStyle === b.key ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <span className="font-medium block">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper Patterns & Custom GIF/Image URL */}
            <div>
              <SectionTitle>padrão de fundo / wallpaper</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => updateCustomTheme({ wallpaper: w.key })}
                    className={`card-object press p-2.5 text-left text-xs cursor-pointer ${
                      custom.wallpaper === w.key ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <span className="font-medium block">{w.label}</span>
                    <span className="text-[0.6rem] text-muted-foreground block mt-0.5">
                      {w.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Image / GIF URL Input */}
              {custom.wallpaper === "custom" && (
                <div className="mt-3">
                  <Field label="URL da Imagem ou GIF de Fundo (Repetível)">
                    <input
                      className={inputClass}
                      value={custom.customWallpaperUrl ?? ""}
                      onChange={(e) => updateCustomTheme({ customWallpaperUrl: e.target.value })}
                      placeholder="https://exemplo.com/fundo-estrelas.gif"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Reset Custom Theme */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  updateSettings({
                    customTheme: DEFAULT_CUSTOM_THEME,
                  });
                  toast.success("Tema MySpace redefinido para o padrão");
                }}
                className="label-chip press bg-card text-xs cursor-pointer"
              >
                Restaurar Padrão MySpace
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Preferences & Accessibility */}
      <section className="mt-6 grid gap-2">
        <SectionTitle>preferências & animações</SectionTitle>
        <Toggle
          label="Animações do toca-discos e transições"
          on={settings.animations}
          onChange={(v) => updateSettings({ animations: v })}
        />
        <Toggle
          label="Decorações e selos analógicos"
          on={settings.decorations}
          onChange={(v) => updateSettings({ decorations: v })}
        />
        <Toggle
          label="Modo privado (ocultar prévias)"
          on={settings.privacy}
          onChange={(v) => updateSettings({ privacy: v })}
        />
      </section>

      {/* Backup and Data */}
      <section className="mt-6 grid gap-2">
        <SectionTitle>dados & backup</SectionTitle>
        <button
          onClick={exportData}
          className="card-object press p-3 text-left text-sm flex items-center justify-between cursor-pointer"
        >
          <span>Exportar backup completo (.json)</span>
          <span className="font-mono text-xs text-muted-foreground">↓ download</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="card-object press p-3 text-left text-sm flex items-center justify-between cursor-pointer"
        >
          <span>Restaurar backup (.json)</span>
          <span className="font-mono text-xs text-muted-foreground">↑ upload</span>
        </button>

        <button
          onClick={() => {
            if (
              confirm("Tem certeza que deseja apagar todo o arquivo? Esta ação é irreversível.")
            ) {
              resetAll();
              toast.success("Arquivo resetado.");
            }
          }}
          className="card-object press p-3 text-left text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
        >
          Apagar todos os dados do arquivo
        </button>
        <p className="px-1 text-xs text-muted-foreground font-mono">
          Suas informações ficam salvas de forma 100% privada neste aparelho.
        </p>
      </section>
    </main>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="card-object press flex items-center justify-between p-3 text-left text-sm cursor-pointer"
    >
      <span>{label}</span>
      <span
        className={`grid h-6 w-11 items-center rounded-full border border-border px-0.5 transition-colors ${
          on ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`size-5 rounded-full bg-card transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}
