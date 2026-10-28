import { DEFAULT_THEME, THEMES, type ThemeKey } from "./themes";

export type DevicePrefs = { theme: ThemeKey; animations: boolean };

export const DEVICE_KEY = "archive.device.v1";

// Old theme names (and the MySpace "custom") map to the closest new theme.
const OLD_TO_NEW: Record<string, ThemeKey> = {
  darkvintage: "noite",
  computer: "noite",
  custom: "noite",
  soft: "algodao",
  y2k: "algodao",
  cassette: "fita",
  cozy: "fita",
};

export function migrateTheme(old?: string | null): ThemeKey {
  if (!old) return DEFAULT_THEME;
  return THEMES.find((t) => t.key === old)?.key ?? OLD_TO_NEW[old] ?? DEFAULT_THEME;
}

export function loadDevicePrefs(fallback: { theme?: string; animations?: boolean }): DevicePrefs {
  let stored: Partial<DevicePrefs> = {};
  try {
    stored = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? "{}") ?? {};
  } catch {
    /* corrupt: use the fallback */
  }
  return {
    theme: migrateTheme(stored.theme ?? fallback.theme),
    animations:
      typeof stored.animations === "boolean" ? stored.animations : (fallback.animations ?? true),
  };
}

export function saveDevicePrefs(p: DevicePrefs): void {
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(p));
  } catch (err) {
    console.warn("Could not save device prefs", err);
  }
}

// Runs before first paint so the page never flashes the wrong theme.
export const THEME_BOOT_SCRIPT = `(function(){try{var m=${JSON.stringify(OLD_TO_NEW)},ok=${JSON.stringify(THEMES.map((t) => t.key))},d=document.documentElement,s=JSON.parse(localStorage.getItem(${JSON.stringify(DEVICE_KEY)})||"{}")||{},t=s.theme;t=ok.indexOf(t)>-1?t:(m[t]||"${DEFAULT_THEME}");d.dataset.theme=t;d.dataset.anim=String(s.animations!==false)}catch(e){}})();`;
