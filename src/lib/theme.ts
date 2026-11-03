import type { DevicePrefs } from "./device";

// Writes this device's theme onto <html> as data-* attributes.
export function applyTheme(root: HTMLElement, prefs: DevicePrefs): void {
  root.dataset["theme"] = prefs.theme;
  root.dataset["anim"] = String(prefs.animations);
}
