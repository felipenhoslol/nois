// @vitest-environment jsdom
import { expect, it } from "vitest";
import {
  DEVICE_KEY,
  THEME_BOOT_SCRIPT,
  loadDevicePrefs,
  migrateTheme,
  saveDevicePrefs,
} from "./device";

it.each([
  ["darkvintage", "noite"],
  ["computer", "noite"],
  ["custom", "noite"],
  ["soft", "algodao"],
  ["y2k", "algodao"],
  ["cassette", "fita"],
  ["cozy", "fita"],
  ["hifi", "hifi"],
  ["vhs", "vhs"],
  ["noite", "noite"],
  [undefined, "ceu"],
  ["xyz", "ceu"],
])("migrateTheme(%s) → %s", (old, key) => expect(migrateTheme(old)).toBe(key));
it("first load copies the shared settings once", () => {
  localStorage.clear();
  expect(loadDevicePrefs({ theme: "cassette", animations: false })).toEqual({
    theme: "fita",
    animations: false,
  });
});
it("stored prefs win over shared settings", () => {
  saveDevicePrefs({ theme: "algodao", animations: true });
  expect(loadDevicePrefs({ theme: "vhs", animations: false })).toEqual({
    theme: "algodao",
    animations: true,
  });
});
it("corrupt storage falls back", () => {
  localStorage.setItem(DEVICE_KEY, "{oops");
  expect(loadDevicePrefs({}).theme).toBe("ceu");
});
it("boot script applies stored theme and migrates old names", () => {
  localStorage.setItem(DEVICE_KEY, '{"theme":"cassette","animations":false}');
  new Function(THEME_BOOT_SCRIPT)();
  expect(document.documentElement.dataset["theme"]).toBe("fita");
  expect(document.documentElement.dataset["anim"]).toBe("false");
});
