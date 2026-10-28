import { expect, it } from "vitest";
import { catMeta } from "./categories";
import { parseTags, seedItems } from "./items";

it("parseTags strips # and splits on comma/space", () =>
  expect(parseTags("#nostalgia, jazz  #verão")).toEqual(["nostalgia", "jazz", "verão"]));

it("parseTags empty", () => expect(parseTags("  ")).toEqual([]));

it("seed ids are stable", () =>
  expect(seedItems().every((i) => i.id.startsWith("seed-"))).toBe(true));

it("catMeta falls back to note", () => expect(catMeta("xyz").key).toBe("note"));
