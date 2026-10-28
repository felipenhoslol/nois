import { expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { DEFAULT_THEME, THEMES, themeCss } from "./themes";

it.each(THEMES)("$key has readable text", ({ tokens: t }) => {
  for (const [fg, bg] of [
    [t.foreground, t.background],
    [t.foreground, t.card],
    [t.mutedForeground, t.background],
    [t.mutedForeground, t.card],
    [t.primary, t.background],
    [t.primary, t.card],
    [t.primaryForeground, t.primary],
    [t.destructive, t.card],
  ] as [string, string][])
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
it("contrastRatio black/white is 21", () =>
  expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
it("themeCss has one block per theme", () => {
  const css = themeCss();
  for (const t of THEMES) expect(css).toContain(`[data-theme="${t.key}"]`);
  expect(css).toContain("--background:#14161D");
});
it("there are exactly 6 themes and ceu is default", () => {
  expect(THEMES.map((t) => t.key)).toEqual(["noite", "algodao", "fita", "hifi", "vhs", "ceu"]);
  expect(DEFAULT_THEME).toBe("ceu");
});
