// @vitest-environment jsdom
import { expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";
import { applyTheme } from "./theme";

it("preset theme sets data-theme and clears custom vars", () => {
  const r = document.documentElement;
  r.style.setProperty("--background", "red");
  applyTheme(r, { ...DEFAULT_SETTINGS, theme: "vhs" });
  expect(r.dataset["theme"]).toBe("vhs");
  expect(r.style.getPropertyValue("--background")).toBe("");
});

it("custom theme writes vars", () => {
  const r = document.documentElement;
  applyTheme(r, {
    ...DEFAULT_SETTINGS,
    useCustomTheme: true,
    customTheme: {
      primary: "#f0f",
      background: "#000",
      surface: "#111",
      font: "pixel",
      borderStyle: "retro",
      wallpaper: "stars",
    },
  });
  expect(r.dataset["theme"]).toBe("custom");
  expect(r.style.getPropertyValue("--card")).toBe("#111");
  expect(r.dataset["font"]).toBe("pixel");
});

it("hue sets primary", () => {
  applyTheme(document.documentElement, { ...DEFAULT_SETTINGS, hue: 200 });
  expect(document.documentElement.style.getPropertyValue("--primary")).toBe("oklch(0.55 0.14 200)");
});
