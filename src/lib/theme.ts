import type { Settings } from "./settings";

// Writes the chosen theme onto <html> as data-* attributes and CSS variables.
export function applyTheme(root: HTMLElement, settings: Settings): void {
  root.dataset["anim"] = String(settings.animations);

  if (settings.useCustomTheme && settings.customTheme) {
    const ct = settings.customTheme;
    root.dataset["theme"] = "custom";
    if (ct.primary) root.style.setProperty("--primary", ct.primary);
    if (ct.secondary) root.style.setProperty("--secondary", ct.secondary);
    if (ct.background) root.style.setProperty("--background", ct.background);
    if (ct.surface) {
      root.style.setProperty("--card", ct.surface);
      root.style.setProperty("--paper", ct.surface);
    }
    if (ct.textColor) root.style.setProperty("--foreground", ct.textColor);
    if (ct.font) root.dataset["font"] = ct.font;
    if (ct.borderStyle) root.dataset["borderStyle"] = ct.borderStyle;
    if (ct.wallpaper) {
      root.dataset["wallpaper"] = ct.wallpaper;
      if (ct.wallpaper === "custom" && ct.customWallpaperUrl) {
        root.style.setProperty("--custom-wallpaper-url", `url('${ct.customWallpaperUrl}')`);
      } else {
        root.style.removeProperty("--custom-wallpaper-url");
      }
    }
    return;
  }

  root.dataset["theme"] = settings.theme;
  root.dataset["wallpaper"] = settings.wallpaper ?? "clean";
  root.removeAttribute("data-font");
  root.removeAttribute("data-border-style");
  root.style.removeProperty("--custom-wallpaper-url");

  if (settings.hue != null) {
    root.style.setProperty("--primary", `oklch(0.55 0.14 ${settings.hue})`);
  } else {
    root.style.removeProperty("--primary");
  }
  for (const v of ["--secondary", "--background", "--card", "--paper", "--foreground"]) {
    root.style.removeProperty(v);
  }
}
