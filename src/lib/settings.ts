export const THEMES = [
  { key: "cassette", label: "Cassete Vintage" },
  { key: "hifi", label: "Hi-Fi Retro" },
  { key: "soft", label: "Soft Retro" },
  { key: "computer", label: "Retro Computer" },
  { key: "vhs", label: "VHS" },
  { key: "darkvintage", label: "Dark Vintage" },
  { key: "y2k", label: "Y2K Retro" },
  { key: "cozy", label: "Cozy Diary" },
];

export type CustomTheme = {
  primary: string;
  secondary?: string;
  background: string;
  surface: string;
  textColor?: string;
  font: "sans" | "serif" | "mono" | "pixel" | "hand";
  borderStyle: "solid" | "dashed" | "double" | "retro" | "none";
  wallpaper: "dots" | "grid" | "crt" | "paper" | "stars" | "sparkles" | "clean" | "custom";
  customWallpaperUrl?: string;
};

export type Settings = {
  archiveName: string;
  personName: string;
  theme: string;
  animations: boolean;
  decorations: boolean;
  privacy: boolean;
  favoriteQuote: string;
  hue: number | null;
  wallpaper: "dots" | "grid" | "crt" | "paper" | "stars" | "sparkles" | "clean" | "custom";
  customTheme?: CustomTheme | undefined;
  useCustomTheme?: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  archiveName: "My Archive",
  personName: "ele",
  theme: "cassette",
  animations: true,
  decorations: true,
  privacy: false,
  favoriteQuote: "guardando pequenas partes de você em um lugar só.",
  hue: null,
  wallpaper: "clean",
  useCustomTheme: false,
};

export const SETTINGS_KEY = "archive.settings.v1";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<Settings>),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (err) {
    console.warn("Could not save settings to localStorage", err);
  }
}

