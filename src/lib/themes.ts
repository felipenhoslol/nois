export type ThemeKey = "noite" | "algodao" | "fita" | "hifi" | "vhs" | "ceu";

export type ThemeTokens = {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  border: string;
  destructive: string;
};

export const DEFAULT_THEME: ThemeKey = "ceu";

export const THEMES: {
  key: ThemeKey;
  label: string;
  mood: string;
  dark: boolean;
  tokens: ThemeTokens;
}[] = [
  {
    key: "noite",
    label: "Noite",
    mood: "Escuro e azulado",
    dark: true,
    tokens: {
      background: "#14161D",
      card: "#1D2029",
      foreground: "#ECEDF2",
      muted: "#262A35",
      mutedForeground: "#A3A8B6",
      primary: "#8FB3FF",
      primaryForeground: "#0F1320",
      border: "#333847",
      destructive: "#FF8A8A",
    },
  },
  {
    key: "algodao",
    label: "Algodão-doce",
    mood: "Rosa claro e doce",
    dark: false,
    tokens: {
      background: "#FFF5F7",
      card: "#FFFFFF",
      foreground: "#3A2230",
      muted: "#FFE6EC",
      mutedForeground: "#7A5566",
      primary: "#C92A62",
      primaryForeground: "#FFFFFF",
      border: "#F1CBD6",
      destructive: "#B3261E",
    },
  },
  {
    key: "fita",
    label: "Fita verde",
    mood: "Verde suave de fita cassete",
    dark: false,
    tokens: {
      background: "#EEF1E8",
      card: "#FAFBF6",
      foreground: "#22281F",
      muted: "#E2E8D8",
      mutedForeground: "#59614F",
      primary: "#3D6B4C",
      primaryForeground: "#FFFFFF",
      border: "#CBD3BE",
      destructive: "#B3261E",
    },
  },
  {
    key: "hifi",
    label: "Hi-Fi",
    mood: "Escuro e quente, cor de âmbar",
    dark: true,
    tokens: {
      background: "#1B1714",
      card: "#27211C",
      foreground: "#F2EADF",
      muted: "#332B24",
      mutedForeground: "#B8AA98",
      primary: "#E8A04B",
      primaryForeground: "#1B1714",
      border: "#463C32",
      destructive: "#FF8E7A",
    },
  },
  {
    key: "vhs",
    label: "VHS",
    mood: "Escuro e roxo",
    dark: true,
    tokens: {
      background: "#17121F",
      card: "#231A2F",
      foreground: "#EFE7F8",
      muted: "#2D2240",
      mutedForeground: "#B3A6C6",
      primary: "#C69BFF",
      primaryForeground: "#17121F",
      border: "#3F3158",
      destructive: "#FF8FA3",
    },
  },
  {
    key: "ceu",
    label: "Céu",
    mood: "Claro e azul",
    dark: false,
    tokens: {
      background: "#F2F6FB",
      card: "#FFFFFF",
      foreground: "#1E2A3A",
      muted: "#E6EDF7",
      mutedForeground: "#556377",
      primary: "#2A64C8",
      primaryForeground: "#FFFFFF",
      border: "#C9D6E8",
      destructive: "#B3261E",
    },
  },
];

const vars = (t: ThemeTokens, dark: boolean) =>
  `--background:${t.background};--card:${t.card};--paper:${t.card};--foreground:${t.foreground};` +
  `--card-foreground:${t.foreground};--secondary-foreground:${t.foreground};--accent-foreground:${t.foreground};` +
  `--muted:${t.muted};--secondary:${t.muted};--accent:${t.muted};--muted-foreground:${t.mutedForeground};` +
  `--primary:${t.primary};--primary-foreground:${t.primaryForeground};--border:${t.border};` +
  `--destructive:${t.destructive};--radius:1rem;color-scheme:${dark ? "dark" : "light"};`;

// One [data-theme] block per theme, plus :root = default theme.
export function themeCss(): string {
  const def = THEMES.find((t) => t.key === DEFAULT_THEME)!;
  return (
    `:root{${vars(def.tokens, def.dark)}}` +
    THEMES.map((t) => `[data-theme="${t.key}"]{${vars(t.tokens, t.dark)}}`).join("")
  );
}
