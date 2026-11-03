// @vitest-environment jsdom
import { expect, it } from "vitest";
import { applyTheme } from "./theme";

it("applyTheme sets data-theme and data-anim", () => {
  const r = document.documentElement;
  applyTheme(r, { theme: "vhs", animations: false });
  expect(r.dataset["theme"]).toBe("vhs");
  expect(r.dataset["anim"]).toBe("false");
});
